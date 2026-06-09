import { describe, it, expect } from "vitest"
import { rankRows, type RawLeaderRow } from "./derive"

function makeRow(overrides: Partial<RawLeaderRow> & { user_id: string }): RawLeaderRow {
  return {
    nick: overrides.user_id,
    total_points: 0,
    exact_hits: 0,
    result_hits: 0,
    predicted_count: 0,
    champion_bonus: 0,
    ...overrides,
  }
}

const CURRENT = "user-1"

describe("rankRows", () => {
  it("returns empty podium and rest for empty input", () => {
    const result = rankRows([], CURRENT)
    expect(result.podium).toHaveLength(0)
    expect(result.rest).toHaveLength(0)
  })

  it("puts all players in podium when fewer than 3", () => {
    const rows = [
      makeRow({ user_id: "u1", total_points: 10, exact_hits: 2 }),
      makeRow({ user_id: "u2", total_points: 5, exact_hits: 1 }),
    ]
    const { podium, rest } = rankRows(rows, CURRENT)
    expect(podium).toHaveLength(2)
    expect(rest).toHaveLength(0)
  })

  it("assigns rank 1 to first player", () => {
    const rows = [
      makeRow({ user_id: "u1", total_points: 10, exact_hits: 3 }),
      makeRow({ user_id: "u2", total_points: 5, exact_hits: 1 }),
    ]
    const { podium } = rankRows(rows, CURRENT)
    expect(podium[0].rank).toBe(1)
    expect(podium[1].rank).toBe(2)
  })

  it("splits top 3 into podium and the rest into rest", () => {
    const rows = Array.from({ length: 6 }, (_, i) =>
      makeRow({ user_id: `u${i + 1}`, total_points: 10 - i, exact_hits: 3 - Math.min(i, 3) }),
    )
    const { podium, rest } = rankRows(rows, CURRENT)
    expect(podium).toHaveLength(3)
    expect(rest).toHaveLength(3)
  })

  it("marks isCurrentUser correctly", () => {
    const rows = [
      makeRow({ user_id: CURRENT, total_points: 15, exact_hits: 5 }),
      makeRow({ user_id: "u2", total_points: 10, exact_hits: 3 }),
      makeRow({ user_id: "u3", total_points: 5, exact_hits: 1 }),
      makeRow({ user_id: "u4", total_points: 2, exact_hits: 0 }),
    ]
    const { podium, rest } = rankRows(rows, CURRENT)
    expect(podium[0].isCurrentUser).toBe(true)
    expect(podium[1].isCurrentUser).toBe(false)
    expect(podium[2].isCurrentUser).toBe(false)
    expect(rest[0].isCurrentUser).toBe(false)
  })

  it("handles isCurrentUser in rest", () => {
    const rows = [
      makeRow({ user_id: "u1", total_points: 15, exact_hits: 5 }),
      makeRow({ user_id: "u2", total_points: 10, exact_hits: 3 }),
      makeRow({ user_id: "u3", total_points: 5, exact_hits: 1 }),
      makeRow({ user_id: CURRENT, total_points: 2, exact_hits: 0 }),
    ]
    const { rest } = rankRows(rows, CURRENT)
    expect(rest[0].isCurrentUser).toBe(true)
  })

  it("assigns same rank for ties (same total_points and exact_hits)", () => {
    const rows = [
      makeRow({ user_id: "u1", total_points: 10, exact_hits: 2 }),
      makeRow({ user_id: "u2", total_points: 10, exact_hits: 2 }), // tie
      makeRow({ user_id: "u3", total_points: 5, exact_hits: 1 }),
    ]
    const { podium } = rankRows(rows, CURRENT)
    expect(podium[0].rank).toBe(1)
    expect(podium[1].rank).toBe(1) // same rank as u1
    expect(podium[2].rank).toBe(3) // skips rank 2
  })

  it("breaks ties by exact_hits — different exact_hits get different ranks", () => {
    const rows = [
      makeRow({ user_id: "u1", total_points: 10, exact_hits: 3 }),
      makeRow({ user_id: "u2", total_points: 10, exact_hits: 2 }), // same points, fewer exact
      makeRow({ user_id: "u3", total_points: 5, exact_hits: 1 }),
    ]
    const { podium } = rankRows(rows, CURRENT)
    expect(podium[0].rank).toBe(1)
    expect(podium[1].rank).toBe(2)
    expect(podium[2].rank).toBe(3)
  })

  it("handles a single player", () => {
    const rows = [makeRow({ user_id: CURRENT, total_points: 10, exact_hits: 2 })]
    const { podium, rest } = rankRows(rows, CURRENT)
    expect(podium).toHaveLength(1)
    expect(rest).toHaveLength(0)
    expect(podium[0].rank).toBe(1)
    expect(podium[0].isCurrentUser).toBe(true)
  })

  it("maps VM fields correctly", () => {
    const rows = [
      makeRow({
        user_id: "u1",
        nick: "Alice",
        total_points: 42,
        exact_hits: 5,
        result_hits: 8,
        predicted_count: 20,
        champion_bonus: 50,
      }),
    ]
    const { podium } = rankRows(rows, CURRENT)
    const row = podium[0]
    expect(row.userId).toBe("u1")
    expect(row.nick).toBe("Alice")
    expect(row.totalPoints).toBe(42)
    expect(row.exactHits).toBe(5)
    expect(row.resultHits).toBe(8)
    expect(row.predictedCount).toBe(20)
    expect(row.championBonus).toBe(50)
  })

  it("handles null DB values gracefully", () => {
    const rows: RawLeaderRow[] = [
      { user_id: null, nick: null, total_points: null, exact_hits: null, result_hits: null, predicted_count: null, champion_bonus: null },
    ]
    const { podium } = rankRows(rows, CURRENT)
    expect(podium[0].totalPoints).toBe(0)
    expect(podium[0].nick).toBe("Gracz")
    expect(podium[0].isCurrentUser).toBe(false)
  })
})
