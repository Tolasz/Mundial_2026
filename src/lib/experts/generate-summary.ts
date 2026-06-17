// Orkiestracja generowania podsumowań dnia AI.
// Wołane przez: /api/cron/generate-summary i /api/admin/generate-summary.
//
// Przepływ:
//   1. Pobierz mecze zakończone (finished) w ostatnich 24h.
//   2. Dla każdego meczu pobierz szczegóły z football-data.org (gole, kartki).
//   3. Pobierz kursy z The Odds API (graceful fallback).
//   4. Pobierz statystyki typowań graczy z player_points_history.
//   5. Pobierz poprzednie opinie ekspertów z expert_opinions.
//   6. Dla każdej persony: zbuduj prompt → wywołaj Azure OpenAI → upsert do daily_summaries.

import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/db"
import {
  findMatchingOddsEvent,
  type OddsApi,
  type OddsEvent,
} from "@/lib/odds-api"
import type { AzureOpenAIClient } from "@/lib/azure-openai"
import type { FootballApi, MatchDetails } from "@/lib/football-api"
import { PERSONAS } from "@/lib/experts/personas"

type Supabase = SupabaseClient<Database>

// ------------------------------------
// Typy
// ------------------------------------

export interface FinishedMatch {
  id: string
  external_id: string | null
  kickoff_at: string
  stage: string
  group: string | null
  home_score: number | null
  away_score: number | null
  homeTeam: { id: string; name: string; short_name: string }
  awayTeam: { id: string; name: string; short_name: string }
}

/** Obiekt w JSONB matches_covered — do audytu */
export interface MatchCovered {
  matchId: string
  homeTeamName: string
  awayTeamName: string
  homeScore: number | null
  awayScore: number | null
  kickoffAt: string
}

export interface SummaryResult {
  persona: string
  ok: boolean
  error?: string
}

export interface GenerateSummaryResult {
  matchCount: number
  summaries: SummaryResult[]
}

// ------------------------------------
// Selekcja zakończonych meczów z ostatnich 24h
// ------------------------------------

export async function selectFinishedMatches(
  supabase: Supabase,
): Promise<FinishedMatch[]> {
  const now = new Date()
  const ago24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  const { data } = await supabase
    .from("matches")
    .select(
      `id, external_id, kickoff_at, stage, group, home_score, away_score,
       homeTeam:teams!matches_home_team_id_fkey(id, name, short_name),
       awayTeam:teams!matches_away_team_id_fkey(id, name, short_name)`,
    )
    .eq("status", "finished")
    .gte("kickoff_at", ago24h.toISOString())
    .lte("kickoff_at", now.toISOString())
    .order("kickoff_at")

  return (data ?? []) as unknown as FinishedMatch[]
}

// ------------------------------------
// Statystyki typowań graczy per mecz
// ------------------------------------

interface MatchPredictionStats {
  matchId: string
  exactHits: number
  resultHits: number
  missHits: number
  topGainers: string[] // nick, max 3
}

async function fetchPredictionStats(
  supabase: Supabase,
  matchIds: string[],
): Promise<Map<string, MatchPredictionStats>> {
  if (matchIds.length === 0) return new Map()

  const { data } = await supabase
    .from("player_points_history")
    .select("match_id, points_awarded, nick:profiles(nick)")
    .in("match_id", matchIds)

  const map = new Map<string, MatchPredictionStats>()

  if (!data) return map

  for (const row of data) {
    const mid = row.match_id as string
    const pts = row.points_awarded as number
    const nick = (row.nick as unknown as { nick: string } | null)?.nick ?? "?"

    if (!map.has(mid)) {
      map.set(mid, { matchId: mid, exactHits: 0, resultHits: 0, missHits: 0, topGainers: [] })
    }
    const s = map.get(mid)!
    if (pts === 3) {
      s.exactHits++
      if (s.topGainers.length < 3) s.topGainers.push(nick)
    } else if (pts === 1) {
      s.resultHits++
    } else {
      s.missHits++
    }
  }

  return map
}

// ------------------------------------
// Tabela liderów
// ------------------------------------

interface LeaderboardEntry {
  rank: number
  nick: string
  totalPoints: number
  exactHits: number
}

async function fetchLeaderboard(
  supabase: Supabase,
): Promise<LeaderboardEntry[]> {
  const { data } = await supabase
    .from("leaderboard")
    .select("nick, total_points, exact_hits")
    .order("total_points", { ascending: false })
    .order("exact_hits", { ascending: false })
    .limit(15)

  if (!data) return []

  let rank = 1
  return data.map((row, i) => {
    if (i > 0) {
      const prev = data[i - 1]
      if ((row.total_points ?? 0) !== (prev.total_points ?? 0) || (row.exact_hits ?? 0) !== (prev.exact_hits ?? 0)) {
        rank = i + 1
      }
    }
    return {
      rank,
      nick: row.nick ?? "Gracz",
      totalPoints: row.total_points ?? 0,
      exactHits: row.exact_hits ?? 0,
    }
  })
}

function buildLeaderboardBlock(entries: LeaderboardEntry[]): string {
  if (entries.length === 0) return "Brak danych o tabeli."
  const rows = entries.map(
    (e) => `  ${e.rank}. ${e.nick} — ${e.totalPoints} pkt (${e.exactHits} dokładnych)`,
  )
  return `Aktualna tabela graczy (top ${entries.length}):\n${rows.join("\n")}`
}

// ------------------------------------
// Poprzednie typy ekspertów per mecz
// ------------------------------------

interface ExpertPickForMatch {
  persona: string
  displayName: string
  homeScore: number
  awayScore: number
}

async function fetchExpertPreviousPicks(
  supabase: Supabase,
  matchIds: string[],
): Promise<Map<string, ExpertPickForMatch[]>> {
  const { data } = await supabase
    .from("expert_opinions")
    .select("persona, display_name, picks")

  const map = new Map<string, ExpertPickForMatch[]>()

  if (!data) return map

  for (const opinion of data) {
    const picks = (opinion.picks ?? []) as Array<{
      matchId: string
      homeScore: number
      awayScore: number
    }>

    for (const pick of picks) {
      if (!matchIds.includes(pick.matchId)) continue
      if (!map.has(pick.matchId)) map.set(pick.matchId, [])
      map.get(pick.matchId)!.push({
        persona: opinion.persona as string,
        displayName: opinion.display_name as string,
        homeScore: pick.homeScore,
        awayScore: pick.awayScore,
      })
    }
  }

  return map
}

// ------------------------------------
// Budowanie bloku meczów do promptu
// ------------------------------------

function formatGoals(details: MatchDetails, homeTeamName: string): string {
  if (details.goals.length === 0) return "Brak danych o golach."

  return details.goals
    .map((g) => {
      const minute = g.minute != null
        ? `${g.minute}'${g.extraTime != null ? `+${g.extraTime}` : ""}`
        : "?"
      const type = g.type === "OWN_GOAL" ? " (samobój)" : g.type === "PENALTY" ? " (karny)" : ""
      const assist = g.assistName ? ` (asysta: ${g.assistName})` : ""
      const team = g.teamName ?? "?"
      return `  ${g.scorerName ?? "?"} ${minute}${type}${assist} [${team}]`
    })
    .join("\n")
}

function formatBookings(details: MatchDetails): string {
  if (details.bookings.length === 0) return "Brak kartek."

  return details.bookings
    .map((b) => {
      const minute = b.minute != null ? `${b.minute}'` : "?"
      const card = b.card === "YELLOW_CARD" ? "żółta" : b.card === "RED_CARD" ? "czerwona" : b.card === "YELLOW_RED_CARD" ? "żółta→czerwona" : b.card ?? "?"
      return `  ${b.playerName ?? "?"} ${minute} — ${card} [${b.teamName ?? "?"}]`
    })
    .join("\n")
}

function buildSummaryPromptBlock(
  matches: FinishedMatch[],
  detailsMap: Map<string, MatchDetails>,
  oddsEvents: OddsEvent[],
  predStats: Map<string, MatchPredictionStats>,
  expertPicks: Map<string, ExpertPickForMatch[]>,
): string {
  return matches
    .map((m) => {
      const homeScore = m.home_score ?? "?"
      const awayScore = m.away_score ?? "?"
      const kickoff = new Date(m.kickoff_at).toLocaleString("pl-PL", {
        timeZone: "Europe/Warsaw",
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })

      const stageLabel = m.group
        ? `Grupa ${m.group} — faza grupowa`
        : m.stage === "r16" ? "1/16 finału"
        : m.stage === "qf" ? "ćwierćfinał"
        : m.stage === "sf" ? "półfinał"
        : m.stage === "final" ? "FINAŁ"
        : m.stage

      // Kursy
      const odds = findMatchingOddsEvent(
        m.homeTeam.name,
        m.awayTeam.name,
        m.kickoff_at,
        oddsEvents,
      )
      const oddsStr = odds
        ? `Kursy przed meczem: ${m.homeTeam.short_name} @${odds.homeOdds ?? "?"}, remis @${odds.drawOdds ?? "?"}, ${m.awayTeam.short_name} @${odds.awayOdds ?? "?"}`
        : "Kursy: niedostępne"

      // Szczegóły
      const details = detailsMap.get(m.id) ?? { goals: [], bookings: [] }
      const goalsStr = formatGoals(details, m.homeTeam.name)
      const bookingsStr = formatBookings(details)

      // Typowania graczy
      const stats = predStats.get(m.id)
      const statsStr = stats
        ? `Typowania graczy: ${stats.exactHits} dokładnych (3 pkt), ${stats.resultHits} wyników (1 pkt), ${stats.missHits} pudłujących.${stats.topGainers.length > 0 ? ` Najlepsi: ${stats.topGainers.join(", ")}.` : ""}`
        : "Typowania graczy: brak danych."

      // Poprzednie typy ekspertów
      const prevPicks = expertPicks.get(m.id) ?? []
      const expertStr = prevPicks.length > 0
        ? `Typy ekspertów przed meczem:\n${prevPicks.map((p) => {
            const correct = p.homeScore === m.home_score && p.awayScore === m.away_score
              ? "✓ dokładnie"
              : (p.homeScore - p.awayScore) * ((m.home_score ?? 0) - (m.away_score ?? 0)) > 0 ||
                (p.homeScore === p.awayScore && m.home_score === m.away_score)
              ? "~ trafił wynik"
              : "✗ pudło"
            return `  ${p.displayName}: ${p.homeScore}-${p.awayScore} — ${correct}`
          }).join("\n")}`
        : "Typy ekspertów: brak danych."

      return [
        `=== ${m.homeTeam.name} ${homeScore}–${awayScore} ${m.awayTeam.name} ===`,
        `Data: ${kickoff} | ${stageLabel}`,
        oddsStr,
        ``,
        `Gole:`,
        goalsStr,
        ``,
        `Kartki:`,
        bookingsStr,
        ``,
        statsStr,
        expertStr,
      ].join("\n")
    })
    .join("\n\n")
}

// ------------------------------------
// Główna funkcja orkiestracji
// ------------------------------------

export async function generateDailySummaries(
  supabase: Supabase,
  footballApi: FootballApi,
  oddsApi: OddsApi,
  aiClient: AzureOpenAIClient,
): Promise<GenerateSummaryResult> {
  // 1. Pobierz zakończone mecze z ostatnich 24h
  const matches = await selectFinishedMatches(supabase)
  if (matches.length === 0) {
    return { matchCount: 0, summaries: [] }
  }

  const matchIds = matches.map((m) => m.id)

  // 2. Pobierz szczegóły meczów równolegle (graceful — błąd = puste tablice)
  const detailsResults = await Promise.allSettled(
    matches.map((m) =>
      m.external_id
        ? footballApi.getMatchDetails(m.external_id)
        : Promise.resolve<MatchDetails>({ goals: [], bookings: [] }),
    ),
  )
  const detailsMap = new Map<string, MatchDetails>()
  matches.forEach((m, i) => {
    const r = detailsResults[i]
    detailsMap.set(m.id, r.status === "fulfilled" ? r.value : { goals: [], bookings: [] })
  })

  // 3. Pobierz kursy (graceful)
  let oddsEvents: OddsEvent[] = []
  try {
    oddsEvents = await oddsApi.getOdds()
  } catch {
    // Kursy niedostępne — kontynuujemy bez nich
  }

  // 4. Pobierz statystyki typowań graczy
  const predStats = await fetchPredictionStats(supabase, matchIds)

  // 5. Pobierz poprzednie typy ekspertów
  const expertPicks = await fetchExpertPreviousPicks(supabase, matchIds)

  // 5b. Pobierz tabelę liderów
  const leaderboardEntries = await fetchLeaderboard(supabase)
  const leaderboardBlock = buildLeaderboardBlock(leaderboardEntries)

  // 6. Zbuduj prompt block
  const matchesBlock = buildSummaryPromptBlock(
    matches,
    detailsMap,
    oddsEvents,
    predStats,
    expertPicks,
  )

  // 7. Dane do JSONB matches_covered
  const matchesCovered: MatchCovered[] = matches.map((m) => ({
    matchId: m.id,
    homeTeamName: m.homeTeam.name,
    awayTeamName: m.awayTeam.name,
    homeScore: m.home_score,
    awayScore: m.away_score,
    kickoffAt: m.kickoff_at,
  }))

  const results: SummaryResult[] = []

  // 8. Generuj podsumowanie dla każdej persony
  for (const persona of PERSONAS) {
    try {
      const userMessage = [
        `Podsumuj wczorajsze mecze Mistrzostw Świata 2026 (${matches.length} mecz${matches.length === 1 ? "" : matches.length < 5 ? "e" : "ów"}):`,
        "",
        matchesBlock,
        "",
        leaderboardBlock,
        "",
        "Napisz KRÓTKIE podsumowanie w swoim stylu — max 3 akapity łącznie. Obowiązkowo skomentuj tabelę graczy: kto wiedzie, kto leży, kto traci punkty jak głupi — bądź maksymalnie krytyczny i złośliwy wobec typujących. Nie oszczędzaj nikogo.",
      ].join("\n")

      const result = await aiClient.chatJson<{ summary: string }>(
        [
          { role: "system", content: persona.summarySystemPrompt },
          { role: "user", content: userMessage },
        ],
        1200,
      )

      if (!result.summary || typeof result.summary !== "string") {
        throw new Error("Nieprawidłowa struktura odpowiedzi LLM.")
      }

      const { error } = await supabase.from("daily_summaries").upsert(
        {
          persona: persona.key,
          display_name: persona.displayName,
          summary: result.summary,
          matches_covered: matchesCovered as unknown as import("@/types/db").Json,
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

  return { matchCount: matches.length, summaries: results }
}
