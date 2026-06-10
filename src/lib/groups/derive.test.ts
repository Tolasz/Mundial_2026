import { describe, it, expect } from "vitest"
import {
  computeGroupStandings,
  type GroupTeamVM,
  type GroupMatchVM,
} from "./derive"

const team = (
  id: string,
  group: string | null,
  name?: string,
): GroupTeamVM => ({
  id,
  name: name ?? `Team ${id}`,
  shortName: id.toUpperCase(),
  flagUrl: `https://example.com/${id}.svg`,
  group,
})

const match = (overrides: Partial<GroupMatchVM>): GroupMatchVM => ({
  group: "A",
  status: "finished",
  homeTeamId: "a",
  awayTeamId: "b",
  homeScore: 0,
  awayScore: 0,
  ...overrides,
})

describe("computeGroupStandings", () => {
  it("returns empty array for no teams", () => {
    expect(computeGroupStandings([], [])).toEqual([])
  })

  it("ignores teams without a group", () => {
    const standings = computeGroupStandings([team("x", null)], [])
    expect(standings).toEqual([])
  })

  it("initializes rows with zeros when no matches played", () => {
    const standings = computeGroupStandings(
      [team("a", "A"), team("b", "A")],
      [],
    )
    expect(standings).toHaveLength(1)
    expect(standings[0].group).toBe("A")
    expect(standings[0].rows).toHaveLength(2)
    for (const row of standings[0].rows) {
      expect(row.played).toBe(0)
      expect(row.points).toBe(0)
      expect(row.goalDiff).toBe(0)
    }
  })

  it("accumulates wins, draws, losses, goals and points", () => {
    const teams = [team("a", "A"), team("b", "A"), team("c", "A")]
    const matches = [
      match({ homeTeamId: "a", awayTeamId: "b", homeScore: 2, awayScore: 0 }), // a win
      match({ homeTeamId: "b", awayTeamId: "c", homeScore: 1, awayScore: 1 }), // draw
      match({ homeTeamId: "a", awayTeamId: "c", homeScore: 0, awayScore: 3 }), // c win
    ]
    const rows = computeGroupStandings(teams, matches)[0].rows
    const byId = Object.fromEntries(rows.map((r) => [r.teamId, r]))

    expect(byId.a).toMatchObject({
      played: 2,
      won: 1,
      drawn: 0,
      lost: 1,
      goalsFor: 2,
      goalsAgainst: 3,
      goalDiff: -1,
      points: 3,
    })
    expect(byId.b).toMatchObject({
      played: 2,
      won: 0,
      drawn: 1,
      lost: 1,
      goalsFor: 1,
      goalsAgainst: 3,
      points: 1,
    })
    expect(byId.c).toMatchObject({
      played: 2,
      won: 1,
      drawn: 1,
      lost: 0,
      goalsFor: 4,
      goalsAgainst: 1,
      goalDiff: 3,
      points: 4,
    })
  })

  it("ignores non-finished matches and matches without scores", () => {
    const teams = [team("a", "A"), team("b", "A")]
    const matches = [
      match({ homeTeamId: "a", awayTeamId: "b", status: "scheduled", homeScore: null, awayScore: null }),
      match({ homeTeamId: "a", awayTeamId: "b", status: "live", homeScore: 1, awayScore: 0 }),
      match({ homeTeamId: "a", awayTeamId: "b", status: "postponed", homeScore: null, awayScore: null }),
      match({ homeTeamId: "a", awayTeamId: "b", status: "finished", homeScore: null, awayScore: null }),
    ]
    const rows = computeGroupStandings(teams, matches)[0].rows
    for (const row of rows) {
      expect(row.played).toBe(0)
      expect(row.points).toBe(0)
    }
  })

  it("sorts by points, then goal difference, then goals for, then name", () => {
    const teams = [
      team("a", "A", "Alpha"),
      team("b", "A", "Bravo"),
      team("c", "A", "Charlie"),
      team("d", "A", "Delta"),
    ]
    const matches = [
      // a: 3 pts, GD +1, GF 1
      match({ homeTeamId: "a", awayTeamId: "b", homeScore: 1, awayScore: 0 }),
      // c: 3 pts, GD +3, GF 3
      match({ homeTeamId: "c", awayTeamId: "d", homeScore: 3, awayScore: 0 }),
    ]
    const rows = computeGroupStandings(teams, matches)[0].rows

    // c first (better GD), then a, then losers d and b (0 pts):
    // b GD -1 GF 0, d GD -3 GF 0 -> b before d
    expect(rows.map((r) => r.teamId)).toEqual(["c", "a", "b", "d"])
    expect(rows.map((r) => r.position)).toEqual([1, 2, 3, 4])
  })

  it("breaks equal points/GD/GF ties alphabetically by name", () => {
    const standings = computeGroupStandings(
      [team("z", "A", "Zeta"), team("m", "A", "Mike")],
      [],
    )
    const rows = standings[0].rows
    expect(rows.map((r) => r.name)).toEqual(["Mike", "Zeta"])
    expect(rows.map((r) => r.position)).toEqual([1, 2])
  })

  it("returns groups sorted alphabetically", () => {
    const teams = [
      team("a", "C"),
      team("b", "C"),
      team("c", "A"),
      team("d", "A"),
      team("e", "B"),
      team("f", "B"),
    ]
    const standings = computeGroupStandings(teams, [])
    expect(standings.map((s) => s.group)).toEqual(["A", "B", "C"])
  })
})

// ---------------------------------------------------------------------------
// FIFA head-to-head tiebreaker
// ---------------------------------------------------------------------------
describe("FIFA H2H tiebreaker", () => {
  it("H2H overrides overall goal difference when two teams are equal on points", () => {
    // 4-team group. A and B both finish with 4 pts.
    // B has better overall GD (+1 vs 0), but A beat B directly → A ranks above B.
    //
    // Results:
    //   A 1-0 B  →  A: 3 pts
    //   C 1-0 A  →  A: 3 pts
    //   A 1-1 D  →  A: 4 pts | D: 1 pt
    //   B 2-0 C  →  B: 3 pts
    //   B 1-1 D  →  B: 4 pts | D: 2 pts
    //   C 2-0 D  →  C: 6 pts
    //
    // Final: C 6 pts, A 4 pts (GD 0), B 4 pts (GD +1), D 2 pts.
    // Without H2H: B > A (better GD). With H2H: A beat B → A > B.
    const teams = [team("a", "A"), team("b", "A"), team("c", "A"), team("d", "A")]
    const matches = [
      match({ homeTeamId: "a", awayTeamId: "b", homeScore: 1, awayScore: 0 }),
      match({ homeTeamId: "c", awayTeamId: "a", homeScore: 1, awayScore: 0 }),
      match({ homeTeamId: "a", awayTeamId: "d", homeScore: 1, awayScore: 1 }),
      match({ homeTeamId: "b", awayTeamId: "c", homeScore: 2, awayScore: 0 }),
      match({ homeTeamId: "b", awayTeamId: "d", homeScore: 1, awayScore: 1 }),
      match({ homeTeamId: "c", awayTeamId: "d", homeScore: 2, awayScore: 0 }),
    ]
    const rows = computeGroupStandings(teams, matches)[0].rows
    expect(rows.map((r) => r.teamId)).toEqual(["c", "a", "b", "d"])
    expect(rows.map((r) => r.position)).toEqual([1, 2, 3, 4])
  })

  it("falls back to overall stats when H2H is circular (all tied in mini-table)", () => {
    // A beats B 2-0, B beats C 2-0, C beats A 2-0 → all 3 pts, GD 0, GF 1 in H2H.
    // H2H gives no separation → fall back to overall GD/GF/wins → also all equal → alphabetical.
    const teams = [team("a", "A"), team("b", "A"), team("c", "A")]
    const matches = [
      match({ homeTeamId: "a", awayTeamId: "b", homeScore: 2, awayScore: 0 }),
      match({ homeTeamId: "b", awayTeamId: "c", homeScore: 2, awayScore: 0 }),
      match({ homeTeamId: "c", awayTeamId: "a", homeScore: 2, awayScore: 0 }),
    ]
    // All: 3 pts, GF 2, GA 2, GD 0 — fully symmetric.
    const rows = computeGroupStandings(teams, matches)[0].rows
    // Alphabetical fallback: a < b < c.
    expect(rows.map((r) => r.teamId)).toEqual(["a", "b", "c"])
  })

  it("applies H2H goal difference to break equal H2H points (circular wins)", () => {
    // Circular wins: a > b 1-0, b > c 1-0, c > a 2-0.
    // All 3 have equal overall stats AND equal H2H pts (3 each).
    // H2H GD: a = +1-2 = -1, b = -1+1 = 0, c = +2-1 = +1.
    // All three are separated by H2H GD → order: c, b, a.
    const teams = [team("a", "A"), team("b", "A"), team("c", "A")]
    const matches = [
      match({ homeTeamId: "a", awayTeamId: "b", homeScore: 1, awayScore: 0 }),
      match({ homeTeamId: "c", awayTeamId: "a", homeScore: 2, awayScore: 0 }),
      match({ homeTeamId: "b", awayTeamId: "c", homeScore: 1, awayScore: 0 }),
    ]
    const rows = computeGroupStandings(teams, matches)[0].rows
    expect(rows.map((r) => r.teamId)).toEqual(["c", "b", "a"])
  })

  it("re-applies H2H to a narrowed sub-group, overriding alphabetical order", () => {
    // 3 teams. Overall stats for all: 3 pts, GD -1, GF 2 (symmetric).
    // H2H: C(Condor) separates first (H2H GD +2).
    // Sub-group {A(Zebra), B(Alpha)}: re-apply H2H → Zebra beat Alpha directly → Zebra > Alpha.
    // Without sub-group re-application, alphabetical would rank Alpha(b) above Zebra(a).
    //
    // Matches:
    //   a(Zebra) 2-0 b(Alpha)  →  Zebra H2H: +2; Alpha H2H: -2
    //   c(Condor) 3-0 a(Zebra) →  Condor H2H: +3; Zebra H2H: -3
    //   b(Alpha) 2-1 c(Condor) →  Alpha H2H: +1; Condor H2H: -1
    //
    // H2H totals (all 3 pts):
    //   Zebra(a): GD = +2-3 = -1, GF = 2
    //   Alpha(b): GD = -2+1 = -1, GF = 2   ← same as Zebra!
    //   Condor(c): GD = +3-1 = +2
    //
    // Condor separates. Sub-group {Zebra, Alpha}: Zebra beat Alpha → Zebra first.
    // Result: [c (Condor), a (Zebra), b (Alpha)].
    const teams = [
      team("a", "A", "Zebra"),
      team("b", "A", "Alpha"),
      team("c", "A", "Condor"),
    ]
    const matches = [
      match({ homeTeamId: "a", awayTeamId: "b", homeScore: 2, awayScore: 0 }),
      match({ homeTeamId: "c", awayTeamId: "a", homeScore: 3, awayScore: 0 }),
      match({ homeTeamId: "b", awayTeamId: "c", homeScore: 2, awayScore: 1 }),
    ]
    const rows = computeGroupStandings(teams, matches)[0].rows
    // FIFA H2H sub-group → [c, a, b]. Simple alphabetical would give [c, b, a].
    expect(rows.map((r) => r.teamId)).toEqual(["c", "a", "b"])
  })
})
