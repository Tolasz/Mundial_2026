import { describe, expect, it } from "vitest"
import {
  buildMatchesPromptBlock,
  selectAuthors,
  assignCommenters,
  AUTHOR_COUNT,
  COMMENTS_PER_POST,
  type UpcomingMatch,
} from "./experts/generate"
import type { OddsEvent } from "./odds-api"
import type { Persona } from "./experts/personas"

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

// ------------------------------------
// Fixtures do testów rotacji
// ------------------------------------

function makePersona(key: string): Persona {
  return {
    key,
    displayName: key,
    systemPrompt: "s",
    summarySystemPrompt: "ss",
    commentSystemPrompt: "cs",
  }
}

const P1 = makePersona("p1")
const P2 = makePersona("p2")
const P3 = makePersona("p3")
const P4 = makePersona("p4")
const P5 = makePersona("p5")
const P6 = makePersona("p6")
const P7 = makePersona("p7")
const P8 = makePersona("p8")
const ALL_8 = [P1, P2, P3, P4, P5, P6, P7, P8] as const

// ------------------------------------
// selectAuthors
// ------------------------------------

describe("selectAuthors", () => {
  it(`zwraca dokładnie AUTHOR_COUNT (${AUTHOR_COUNT}) person`, () => {
    const result = selectAuthors(ALL_8, AUTHOR_COUNT, [])
    expect(result).toHaveLength(AUTHOR_COUNT)
  })

  it("nie powtarza person w wyniku", () => {
    const result = selectAuthors(ALL_8, AUTHOR_COUNT, [])
    const keys = result.map(p => p.key)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it("wyklucza persony z poprzedniej rundy gdy dostępni inni", () => {
    const prevKeys = ["p1", "p2", "p3"]
    const result = selectAuthors(ALL_8, AUTHOR_COUNT, prevKeys)
    const resultKeys = result.map(p => p.key)
    for (const key of prevKeys) {
      expect(resultKeys).not.toContain(key)
    }
  })

  it("fallback gdy pula po wykluczeniu jest za mała — uzupełnia z wykluczonych", () => {
    // Wyklucz 7 z 8 — pula ma tylko 1 osobę → fallback
    const prevKeys = ["p1", "p2", "p3", "p4", "p5", "p6", "p7"]
    const result = selectAuthors(ALL_8, AUTHOR_COUNT, prevKeys)
    expect(result).toHaveLength(AUTHOR_COUNT)
    const keys = result.map(p => p.key)
    expect(new Set(keys).size).toBe(AUTHOR_COUNT)
  })

  it("zwraca wszystkie persony gdy lista ma dokładnie n elementów", () => {
    const small = [P1, P2, P3] as const
    const result = selectAuthors(small, 3, [])
    expect(result).toHaveLength(3)
    expect(result.map(p => p.key).sort()).toEqual(["p1", "p2", "p3"])
  })
})

// ------------------------------------
// assignCommenters
// ------------------------------------

describe("assignCommenters", () => {
  it(`każdy post dostaje dokładnie COMMENTS_PER_POST (${COMMENTS_PER_POST}) komentujących`, () => {
    const authors = [P1, P2]
    const result = assignCommenters(authors, ALL_8)
    for (const [, commenters] of result) {
      expect(commenters).toHaveLength(COMMENTS_PER_POST)
    }
  })

  it("żaden autor nie komentuje swojego własnego posta", () => {
    const authors = [P1, P2]
    const result = assignCommenters(authors, ALL_8)
    for (const [postKey, commenters] of result) {
      for (const c of commenters) {
        expect(c.key).not.toBe(postKey)
      }
    }
  })

  it("żaden komentujący nie jest autorem żadnego innego posta", () => {
    const authors = [P1, P2]
    const authorKeys = new Set(authors.map(a => a.key))
    const result = assignCommenters(authors, ALL_8)
    for (const [, commenters] of result) {
      for (const c of commenters) {
        expect(authorKeys.has(c.key)).toBe(false)
      }
    }
  })

  it("zwraca mapę z kluczem per autor", () => {
    const authors = [P1, P2]
    const result = assignCommenters(authors, ALL_8)
    expect([...result.keys()].sort()).toEqual(["p1", "p2"])
  })
})
