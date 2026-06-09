import { describe, it, expect } from "vitest"
import { computePlayerStats, buildStatsVM } from "./player"
import type { PlayerPointsHistoryRow, LeaderboardRow } from "@/types/db"

function makeRow(
  points: number | null,
  stage: PlayerPointsHistoryRow["stage"] = "group",
): PlayerPointsHistoryRow {
  return {
    user_id: "u1",
    prediction_id: Math.random().toString(),
    match_id: Math.random().toString(),
    kickoff_at: new Date().toISOString(),
    stage,
    group: null,
    round_label: null,
    home_score: 1,
    away_score: 0,
    status: "finished",
    home_team_name: "Team A",
    home_team_short: "A",
    home_team_flag: "",
    away_team_name: "Team B",
    away_team_short: "B",
    away_team_flag: "",
    home_pick: 1,
    away_pick: 0,
    points_awarded: points,
    cumulative_points: 0,
  }
}

describe("computePlayerStats", () => {
  it("returns all zeros for empty input", () => {
    const stats = computePlayerStats([])
    expect(stats.totalSettled).toBe(0)
    expect(stats.exactHits).toBe(0)
    expect(stats.resultHits).toBe(0)
    expect(stats.missHits).toBe(0)
    expect(stats.accuracyPct).toBe(0)
    expect(stats.avgPointsPerMatch).toBe(0)
    expect(stats.bestStreak).toBe(0)
  })

  it("ignores unsettled rows (points_awarded === null)", () => {
    const rows = [makeRow(null), makeRow(null)]
    const stats = computePlayerStats(rows)
    expect(stats.totalSettled).toBe(0)
    expect(stats.exactHits).toBe(0)
  })

  it("counts exact/result/miss hits correctly", () => {
    const rows = [
      makeRow(3),
      makeRow(3),
      makeRow(1),
      makeRow(0),
      makeRow(0),
      makeRow(0),
    ]
    const stats = computePlayerStats(rows)
    expect(stats.totalSettled).toBe(6)
    expect(stats.exactHits).toBe(2)
    expect(stats.resultHits).toBe(1)
    expect(stats.missHits).toBe(3)
  })

  it("calculates accuracyPct — (exact+result)/settled * 100, rounded", () => {
    // 2 exact + 1 result out of 6 = 3/6 = 50%
    const rows = [makeRow(3), makeRow(3), makeRow(1), makeRow(0), makeRow(0), makeRow(0)]
    const stats = computePlayerStats(rows)
    expect(stats.accuracyPct).toBe(50)
  })

  it("accuracyPct is 0 for empty settled — no division by zero", () => {
    const stats = computePlayerStats([makeRow(null)])
    expect(stats.accuracyPct).toBe(0)
  })

  it("calculates avgPointsPerMatch correctly", () => {
    // 3 + 1 + 0 = 4 over 3 matches → ~1.33
    const rows = [makeRow(3), makeRow(1), makeRow(0)]
    const stats = computePlayerStats(rows)
    expect(stats.avgPointsPerMatch).toBeCloseTo(1.33, 2)
  })

  it("avgPointsPerMatch is 0 for no settled matches", () => {
    const stats = computePlayerStats([])
    expect(stats.avgPointsPerMatch).toBe(0)
  })

  it("computes bestStreak: consecutive rows with points > 0", () => {
    // streak: 3,1,1 → length 3; then 0 breaks; then 3,3 → length 2
    const rows = [makeRow(3), makeRow(1), makeRow(1), makeRow(0), makeRow(3), makeRow(3)]
    const stats = computePlayerStats(rows)
    expect(stats.bestStreak).toBe(3)
  })

  it("bestStreak handles single row with points", () => {
    const stats = computePlayerStats([makeRow(3)])
    expect(stats.bestStreak).toBe(1)
  })

  it("bestStreak is 0 when all rows are misses", () => {
    const rows = [makeRow(0), makeRow(0)]
    const stats = computePlayerStats(rows)
    expect(stats.bestStreak).toBe(0)
  })

  it("bestStreak works with a single break in the middle", () => {
    const rows = [makeRow(3), makeRow(0), makeRow(1), makeRow(1), makeRow(3)]
    const stats = computePlayerStats(rows)
    expect(stats.bestStreak).toBe(3) // 1,1,3 at the end
  })

  it("aggregates pointsByStage per stage", () => {
    const rows = [
      makeRow(3, "group"),
      makeRow(1, "group"),
      makeRow(3, "qf"),
      makeRow(0, "qf"),
    ]
    const stats = computePlayerStats(rows)
    expect(stats.pointsByStage["group"]).toBe(4)
    expect(stats.pointsByStage["qf"]).toBe(3)
    expect(stats.pointsByStage["r16"]).toBe(0)
  })
})

describe("buildStatsVM", () => {
  it("includes championBonus and totalPoints from leaderboard row", () => {
    const rows = [makeRow(3), makeRow(1)]
    const lbRow: Pick<LeaderboardRow, "champion_bonus" | "total_points"> = {
      champion_bonus: 50,
      total_points: 54,
    }
    const vm = buildStatsVM(rows, lbRow)
    expect(vm.championBonus).toBe(50)
    expect(vm.totalPoints).toBe(54)
    expect(vm.exactHits).toBe(1)
  })

  it("defaults champion bonus and total to 0 when leaderboard row is null", () => {
    const vm = buildStatsVM([], null)
    expect(vm.championBonus).toBe(0)
    expect(vm.totalPoints).toBe(0)
  })
})
