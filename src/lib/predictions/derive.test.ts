import { describe, it, expect } from "vitest"
import {
  deriveMatchStatus,
  filterMatches,
  sortMatches,
  type MatchVM,
  type TeamVM,
} from "./derive"

function makeTeam(name: string, shortName = name): TeamVM {
  return { id: `t-${name}`, name, shortName, flagUrl: "" }
}

function makeMatch(overrides: Partial<MatchVM> & { id: string }): MatchVM {
  return {
    group: null,
    stage: "group",
    roundLabel: null,
    kickoffAt: "2026-06-01T12:00:00Z",
    home: makeTeam("Home"),
    away: makeTeam("Away"),
    prediction: null,
    isLocked: false,
    predictionStatus: "empty",
    otherPredictions: [],
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// deriveMatchStatus
// ---------------------------------------------------------------------------
describe("deriveMatchStatus", () => {
  it("returns empty when no prediction and not locked", () => {
    expect(deriveMatchStatus({ prediction: null, isLocked: false })).toBe("empty")
  })

  it("returns saved when prediction exists and not locked", () => {
    expect(
      deriveMatchStatus({ prediction: { homePick: 1, awayPick: 0 }, isLocked: false }),
    ).toBe("saved")
  })

  it("returns locked when isLocked is true (no prediction)", () => {
    expect(deriveMatchStatus({ prediction: null, isLocked: true })).toBe("locked")
  })

  it("returns locked when isLocked is true (with prediction)", () => {
    expect(
      deriveMatchStatus({ prediction: { homePick: 2, awayPick: 1 }, isLocked: true }),
    ).toBe("locked")
  })
})

// ---------------------------------------------------------------------------
// filterMatches
// ---------------------------------------------------------------------------
describe("filterMatches", () => {
  const matches: MatchVM[] = [
    makeMatch({
      id: "1",
      group: "A",
      stage: "group",
      predictionStatus: "empty",
      home: makeTeam("Poland", "POL"),
      away: makeTeam("Brazil", "BRA"),
    }),
    makeMatch({
      id: "2",
      group: "A",
      stage: "group",
      predictionStatus: "saved",
      prediction: { homePick: 1, awayPick: 0 },
      home: makeTeam("France", "FRA"),
      away: makeTeam("Germany", "GER"),
    }),
    makeMatch({
      id: "3",
      group: "B",
      stage: "group",
      predictionStatus: "locked",
      isLocked: true,
      home: makeTeam("Argentina", "ARG"),
      away: makeTeam("Spain", "ESP"),
    }),
    makeMatch({
      id: "4",
      group: null,
      stage: "r16",
      predictionStatus: "empty",
      home: makeTeam("Portugal", "POR"),
      away: makeTeam("Italy", "ITA"),
    }),
  ]

  it("returns all matches with default filters", () => {
    expect(
      filterMatches(matches, { group: "all", status: "all", query: "" }),
    ).toHaveLength(4)
  })

  it("filters by group letter", () => {
    const result = filterMatches(matches, { group: "A", status: "all", query: "" })
    expect(result).toHaveLength(2)
    expect(result.every((m) => m.group === "A")).toBe(true)
  })

  it("excludes knockout (group=null) when filtering by group letter", () => {
    const result = filterMatches(matches, { group: "B", status: "all", query: "" })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe("3")
  })

  it("returns empty array when no matches have requested group", () => {
    const result = filterMatches(matches, { group: "Z", status: "all", query: "" })
    expect(result).toHaveLength(0)
  })

  it("filters by status empty", () => {
    const result = filterMatches(matches, { group: "all", status: "empty", query: "" })
    expect(result).toHaveLength(2)
    expect(result.every((m) => m.predictionStatus === "empty")).toBe(true)
  })

  it("filters by status saved", () => {
    const result = filterMatches(matches, { group: "all", status: "saved", query: "" })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe("2")
  })

  it("filters by status locked", () => {
    const result = filterMatches(matches, { group: "all", status: "locked", query: "" })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe("3")
  })

  it("filters by query matching home team name (case-insensitive)", () => {
    const result = filterMatches(matches, { group: "all", status: "all", query: "POLAND" })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe("1")
  })

  it("filters by query matching away team shortName", () => {
    const result = filterMatches(matches, { group: "all", status: "all", query: "bra" })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe("1")
  })

  it("filters by query matching away team name", () => {
    const result = filterMatches(matches, { group: "all", status: "all", query: "germany" })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe("2")
  })

  it("returns empty array when query matches nothing", () => {
    const result = filterMatches(matches, {
      group: "all",
      status: "all",
      query: "xxxxxxxxxxx",
    })
    expect(result).toHaveLength(0)
  })

  it("combines group and status filters", () => {
    const result = filterMatches(matches, { group: "A", status: "saved", query: "" })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe("2")
  })

  it("trims whitespace from query", () => {
    const result = filterMatches(matches, { group: "all", status: "all", query: "  france  " })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe("2")
  })
})

// ---------------------------------------------------------------------------
// sortMatches
// ---------------------------------------------------------------------------
describe("sortMatches", () => {
  const m1 = makeMatch({ id: "1", kickoffAt: "2026-06-03T18:00:00Z" })
  const m2 = makeMatch({ id: "2", kickoffAt: "2026-06-01T12:00:00Z" })
  const m3 = makeMatch({ id: "3", kickoffAt: "2026-06-02T15:00:00Z" })
  const matches = [m1, m2, m3]

  it("sorts ascending by kickoffAt", () => {
    const result = sortMatches(matches, "asc")
    expect(result.map((m) => m.id)).toEqual(["2", "3", "1"])
  })

  it("sorts descending by kickoffAt", () => {
    const result = sortMatches(matches, "desc")
    expect(result.map((m) => m.id)).toEqual(["1", "3", "2"])
  })

  it("does not mutate the original array", () => {
    const original = [...matches]
    sortMatches(matches, "asc")
    expect(matches.map((m) => m.id)).toEqual(original.map((m) => m.id))
  })

  it("is stable for matches with identical kickoffAt", () => {
    const mA = makeMatch({ id: "A", kickoffAt: "2026-06-01T12:00:00Z" })
    const mB = makeMatch({ id: "B", kickoffAt: "2026-06-01T12:00:00Z" })
    const result = sortMatches([mA, mB], "asc")
    expect(result.map((m) => m.id)).toEqual(["A", "B"])
  })
})
