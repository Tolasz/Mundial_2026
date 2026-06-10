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
import { PERSONAS } from "@/lib/experts/personas"

type Supabase = SupabaseClient<Database>

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
