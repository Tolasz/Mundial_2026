// Orkiestracja generowania opinii ekspertów AI.
// Wołane przez: /api/cron/generate-opinions i /api/admin/generate-opinions.
//
// Przepływ:
//   1. Pobierz mecze z okna 24h (lub 4 najbliższe scheduled).
//   2. Pobierz kursy z The Odds API (graceful fallback przy braku).
//   3. Dla każdej persony: zbuduj prompt → wywołaj Azure OpenAI → upsert do expert_opinions.

import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/db"
import {
  findMatchingOddsEvent,
  type OddsApi,
  type OddsEvent,
} from "@/lib/odds-api"
import type { AzureOpenAIClient } from "@/lib/azure-openai"
import { PERSONAS, type Persona } from "@/lib/experts/personas"

type Supabase = SupabaseClient<Database>

// ------------------------------------
// Stałe i helpery rotacji
// ------------------------------------

export const AUTHOR_COUNT = 2
export const COMMENTS_PER_POST = 3

function shuffleArray<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/** Wybiera n person z wykluczeniem previousRound (unikanie powtórzeń). Fallback gdy pula za mała. */
export function selectAuthors(
  personas: readonly Persona[],
  n: number,
  excludeKeys: string[],
): Persona[] {
  const pool = personas.filter(p => !excludeKeys.includes(p.key))
  if (pool.length >= n) {
    return shuffleArray([...pool]).slice(0, n)
  }
  const excluded = personas.filter(p => excludeKeys.includes(p.key))
  return shuffleArray([...pool, ...shuffleArray([...excluded])]).slice(0, n)
}

/** Przydziela dokładnie COMMENTS_PER_POST losowych komentujących (spoza autorów) do każdego posta. */
export function assignCommenters(
  authors: readonly Persona[],
  allPersonas: readonly Persona[],
): Map<string, Persona[]> {
  const authorKeys = new Set(authors.map(a => a.key))
  const pool = allPersonas.filter(p => !authorKeys.has(p.key))
  const map = new Map<string, Persona[]>()
  for (const author of authors) {
    map.set(author.key, shuffleArray([...pool]).slice(0, COMMENTS_PER_POST))
  }
  return map
}

// ------------------------------------
// Typy
// ------------------------------------

export interface UpcomingMatch {
  id: string
  kickoff_at: string
  stage: string
  group: string | null
  homeTeam: { id: string; name: string; short_name: string }
  awayTeam: { id: string; name: string; short_name: string }
}

/** Wzbogacony typ wyniku (przechowywany w JSONB picks) */
export interface ExpertPick {
  matchId: string
  homeTeamName: string
  awayTeamName: string
  homeTeamShort: string
  awayTeamShort: string
  kickoffAt: string
  homeScore: number
  awayScore: number
  reason: string
}

/** Odpowiedź surowa z LLM (przed wzbogaceniem) */
interface LLMPick {
  matchId: string
  homeScore: number
  awayScore: number
  reason: string
}

interface LLMOpinion {
  intro: string
  picks: LLMPick[]
}

interface LLMComment {
  postPersona: string
  stance?: string
  body: string
}

interface LLMCommentBatch {
  comments: LLMComment[]
}

export interface ExpertOpinionResult {
  persona: string
  ok: boolean
  error?: string
}

export interface GenerateResult {
  matchCount: number
  opinions: ExpertOpinionResult[]
}

// ------------------------------------
// Selekcja meczów
// ------------------------------------

/** Eksportowane do testów */
export async function selectUpcomingMatches(
  supabase: Supabase,
): Promise<UpcomingMatch[]> {
  const now = new Date()
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000)

  // Mecze w oknie 24h
  const { data: window24 } = await supabase
    .from("matches")
    .select(
      `id, kickoff_at, stage, group,
       homeTeam:teams!matches_home_team_id_fkey(id, name, short_name),
       awayTeam:teams!matches_away_team_id_fkey(id, name, short_name)`,
    )
    .eq("status", "scheduled")
    .gte("kickoff_at", now.toISOString())
    .lte("kickoff_at", in24h.toISOString())
    .order("kickoff_at")

  if (window24 && window24.length > 0) {
    return window24 as unknown as UpcomingMatch[]
  }

  // Fallback: 4 najbliższe nadchodzące mecze
  const { data: nearest } = await supabase
    .from("matches")
    .select(
      `id, kickoff_at, stage, group,
       homeTeam:teams!matches_home_team_id_fkey(id, name, short_name),
       awayTeam:teams!matches_away_team_id_fkey(id, name, short_name)`,
    )
    .eq("status", "scheduled")
    .gte("kickoff_at", now.toISOString())
    .order("kickoff_at")
    .limit(4)

  return (nearest ?? []) as unknown as UpcomingMatch[]
}

// ------------------------------------
// Budowanie bloku meczów do promptu
// ------------------------------------

/** Eksportowane do testów */
export function buildMatchesPromptBlock(
  matches: UpcomingMatch[],
  oddsEvents: OddsEvent[],
): string {
  return matches
    .map((m) => {
      const odds = findMatchingOddsEvent(
        m.homeTeam.name,
        m.awayTeam.name,
        m.kickoff_at,
        oddsEvents,
      )
      const kickoff = new Date(m.kickoff_at).toLocaleString("pl-PL", {
        timeZone: "Europe/Warsaw",
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
      const oddsStr = odds
        ? `(kursy: ${m.homeTeam.short_name} @${odds.homeOdds ?? "?"}, remis @${odds.drawOdds ?? "?"}, ${m.awayTeam.short_name} @${odds.awayOdds ?? "?"})`
        : "(kursy niedostępne)"

      return `- matchId: ${m.id} | ${m.homeTeam.name} vs ${m.awayTeam.name} | ${kickoff} ${oddsStr}`
    })
    .join("\n")
}

// ------------------------------------
// Wzbogacenie picków LLM o dane drużyn
// ------------------------------------

function enrichPicks(
  llmPicks: LLMPick[],
  matches: UpcomingMatch[],
): ExpertPick[] {
  const matchById = new Map(matches.map((m) => [m.id, m]))

  return llmPicks
    .filter((p) => matchById.has(p.matchId))
    .map((p) => {
      const m = matchById.get(p.matchId)!
      return {
        matchId: p.matchId,
        homeTeamName: m.homeTeam.name,
        awayTeamName: m.awayTeam.name,
        homeTeamShort: m.homeTeam.short_name,
        awayTeamShort: m.awayTeam.short_name,
        kickoffAt: m.kickoff_at,
        homeScore: Math.max(0, Math.round(Number(p.homeScore) || 0)),
        awayScore: Math.max(0, Math.round(Number(p.awayScore) || 0)),
        reason: p.reason ?? "",
      }
    })
}

// ------------------------------------
// Generowanie komentarzy (współdzielone z generate-summary.ts)
// ------------------------------------

export async function generateComments(
  supabase: Supabase,
  aiClient: AzureOpenAIClient,
  commenter: Persona,
  posts: Array<{ postPersona: string; displayName: string; content: string }>,
  postType: "opinion" | "summary",
): Promise<void> {
  const postsBlock = posts
    .map(p => `--- Post od: ${p.displayName} (klucz: ${p.postPersona}) ---\n${p.content}`)
    .join("\n\n")

  const userMessage = [
    `Oto ${posts.length} post${posts.length === 1 ? "" : "y"} ekspertów, do których masz się krótko odnieść:`,
    "",
    postsBlock,
    "",
    "Skomentuj KAŻDY z tych postów. Użyj klucza z nagłówka (np. \"almost_pewniak\") jako postPersona.",
  ].join("\n")

  try {
    const result = await aiClient.chatJson<LLMCommentBatch>([
      { role: "system", content: commenter.commentSystemPrompt },
      { role: "user", content: userMessage },
    ])

    if (!Array.isArray(result.comments)) return

    const rows = result.comments
      .filter(c => c.postPersona && c.body)
      .map(c => ({
        post_type: postType,
        post_persona: c.postPersona,
        commenter_persona: commenter.key,
        commenter_display_name: commenter.displayName,
        stance: c.stance ?? null,
        body: c.body,
        generated_at: new Date().toISOString(),
      }))

    if (rows.length > 0) {
      await supabase.from("expert_comments").insert(rows)
    }
  } catch {
    // Komentarze są opcjonalne — błąd nie blokuje rundy
  }
}

// ------------------------------------
// Główna funkcja orkiestracji
// ------------------------------------

export async function generateExpertOpinions(
  supabase: Supabase,
  oddsApi: OddsApi,
  aiClient: AzureOpenAIClient,
): Promise<GenerateResult> {
  // 1. Wybierz mecze
  const matches = await selectUpcomingMatches(supabase)
  if (matches.length === 0) {
    return { matchCount: 0, opinions: [] }
  }

  // 2. Pobierz kursy (graceful — brak kursów nie blokuje generowania)
  let oddsEvents: OddsEvent[] = []
  try {
    oddsEvents = await oddsApi.getOdds()
  } catch {
    // Kursy niedostępne — agenci typują bez nich
  }

  const matchesBlock = buildMatchesPromptBlock(matches, oddsEvents)
  const results: ExpertOpinionResult[] = []

  // 3. Generuj opinię dla każdej persony
  for (const persona of PERSONAS) {
    try {
      const userMessage = [
        `Oto nadchodzące mecze Mistrzostw Świata 2026 (${matches.length} meczów):`,
        "",
        matchesBlock,
        "",
        `Skomentuj nadchodzące mecze w swoim stylu i podaj typy wyników dla WSZYSTKICH ${matches.length} meczów.`,
        "Używaj dokładnych matchId z listy powyżej.",
      ].join("\n")

      const opinion = await aiClient.chatJson<LLMOpinion>([
        { role: "system", content: persona.systemPrompt },
        { role: "user", content: userMessage },
      ])

      if (!opinion.intro || !Array.isArray(opinion.picks)) {
        throw new Error("Nieprawidłowa struktura odpowiedzi LLM.")
      }

      const enrichedPicks = enrichPicks(opinion.picks, matches)

      const { error } = await supabase.from("expert_opinions").upsert(
        {
          persona: persona.key,
          display_name: persona.displayName,
          intro: opinion.intro,
          picks: enrichedPicks as unknown as import("@/types/db").Json,
          generated_at: new Date().toISOString(),
        },
        { onConflict: "persona" },
      )

      if (error) throw error

      results.push({ persona: persona.key, ok: true })
    } catch (err) {
      results.push({
        persona: persona.key,
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }

  return { matchCount: matches.length, opinions: results }
}
