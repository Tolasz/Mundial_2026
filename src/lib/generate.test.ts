import { describe, expect, it } from "vitest"
import {
  buildMatchesPromptBlock,
  type UpcomingMatch,
} from "./experts/generate"
import type { OddsEvent } from "./odds-api"

// ------------------------------------
// Fixtures
// ------------------------------------

const MATCH_A: UpcomingMatch = {
  id: "match-1",
  kickoff_at: "2026-06-15T18:00:00Z",
  stage: "group",
  group: "A",
  homeTeam: { id: "t1", name: "Brazil", short_name: "BRA" },
  awayTeam: { id: "t2", name: "Argentina", short_name: "ARG" },
}

const MATCH_B: UpcomingMatch = {
  id: "match-2",
  kickoff_at: "2026-06-15T21:00:00Z",
  stage: "group",
  group: "B",
  homeTeam: { id: "t3", name: "Spain", short_name: "ESP" },
  awayTeam: { id: "t4", name: "Germany", short_name: "GER" },
}

const ODDS_A: OddsEvent = {
  id: "ev1",
  homeTeam: "Brazil",
  awayTeam: "Argentina",
  commenceTime: "2026-06-15T18:00:00Z",
  homeOdds: 2.1,
  drawOdds: 3.0,
  awayOdds: 3.5,
}

// ------------------------------------
// buildMatchesPromptBlock
// ------------------------------------

describe("buildMatchesPromptBlock", () => {
  it("zawiera matchId, nazwy drużyn i kursy gdy dostępne", () => {
    const block = buildMatchesPromptBlock([MATCH_A], [ODDS_A])
    expect(block).toContain("match-1")
    expect(block).toContain("Brazil")
    expect(block).toContain("Argentina")
    expect(block).toContain("@2.1")
    expect(block).toContain("@3.5")
  })

  it("wyświetla '(kursy niedostępne)' gdy brak dopasowania", () => {
    const block = buildMatchesPromptBlock([MATCH_B], [ODDS_A])
    expect(block).toContain("kursy niedostępne")
    expect(block).toContain("match-2")
    expect(block).toContain("Spain")
    expect(block).toContain("Germany")
  })

  it("obsługuje pusty zestaw kursów", () => {
    const block = buildMatchesPromptBlock([MATCH_A, MATCH_B], [])
    expect(block).toContain("match-1")
    expect(block).toContain("match-2")
    expect(block.split("kursy niedostępne")).toHaveLength(3) // 2 mecze = 2 wystąpienia
  })

  it("zwraca pusty string dla pustej listy meczów", () => {
    expect(buildMatchesPromptBlock([], [])).toBe("")
  })
})
