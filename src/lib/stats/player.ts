// Pure player statistics functions — no React / Supabase dependencies.

import type { PlayerPointsHistoryRow, LeaderboardRow, MatchStage } from "@/types/db"

export interface PlayerStats {
  totalSettled: number
  exactHits: number
  resultHits: number
  missHits: number
  accuracyPct: number
  avgPointsPerMatch: number
  bestStreak: number
  pointsByStage: Record<MatchStage, number>
}

export interface PlayerStatsVM extends PlayerStats {
  championBonus: number
  totalPoints: number
}

const STAGES: MatchStage[] = ["group", "r32", "r16", "qf", "sf", "final"]

function emptyByStage(): Record<MatchStage, number> {
  return Object.fromEntries(STAGES.map((s) => [s, 0])) as Record<MatchStage, number>
}

/**
 * Compute player stats from settled (points_awarded != null) history rows.
 * Safe for empty input — returns zeros, no division by zero.
 */
export function computePlayerStats(
  historyRows: PlayerPointsHistoryRow[],
): PlayerStats {
  const settled = historyRows.filter((r) => r.points_awarded !== null)

  const totalSettled = settled.length
  const exactHits = settled.filter((r) => r.points_awarded === 3).length
  const resultHits = settled.filter((r) => r.points_awarded === 1).length
  const missHits = settled.filter((r) => r.points_awarded === 0).length

  const accuracyPct =
    totalSettled === 0
      ? 0
      : Math.round(((exactHits + resultHits) / totalSettled) * 100)

  const totalMatchPoints = settled.reduce(
    (sum, r) => sum + (r.points_awarded ?? 0),
    0,
  )
  const avgPointsPerMatch =
    totalSettled === 0
      ? 0
      : Math.round((totalMatchPoints / totalSettled) * 100) / 100

  // Best streak: longest consecutive run of rows with points_awarded > 0
  let bestStreak = 0
  let currentStreak = 0
  for (const row of settled) {
    if ((row.points_awarded ?? 0) > 0) {
      currentStreak++
      if (currentStreak > bestStreak) bestStreak = currentStreak
    } else {
      currentStreak = 0
    }
  }

  const pointsByStage = emptyByStage()
  for (const row of settled) {
    if (row.stage && row.points_awarded !== null) {
      pointsByStage[row.stage] = (pointsByStage[row.stage] ?? 0) + row.points_awarded
    }
  }

  return {
    totalSettled,
    exactHits,
    resultHits,
    missHits,
    accuracyPct,
    avgPointsPerMatch,
    bestStreak,
    pointsByStage,
  }
}

/**
 * Build full view model combining per-match stats with leaderboard totals.
 */
export function buildStatsVM(
  historyRows: PlayerPointsHistoryRow[],
  leaderboardRow: Pick<LeaderboardRow, "champion_bonus" | "total_points"> | null,
): PlayerStatsVM {
  const stats = computePlayerStats(historyRows)
  return {
    ...stats,
    championBonus: leaderboardRow?.champion_bonus ?? 0,
    totalPoints: leaderboardRow?.total_points ?? 0,
  }
}
