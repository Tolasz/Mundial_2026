// Pure leaderboard logic — no React / Supabase dependencies.

export interface LeaderRow {
  userId: string
  nick: string
  totalPoints: number
  exactHits: number
  resultHits: number
  predictedCount: number
  championBonus: number
  rank: number
  isCurrentUser: boolean
  /** Zmiana pozycji względem poprzedniego dnia (> 0 = awans, < 0 = spadek, null = brak historii) */
  rankChange: number | null
}

/** Raw row from the leaderboard view */
export interface RawLeaderRow {
  user_id: string | null
  nick: string | null
  total_points: number | null
  exact_hits: number | null
  result_hits: number | null
  predicted_count: number | null
  champion_bonus: number | null
}

export interface RankedLeaderboard {
  podium: LeaderRow[]   // top 3 (may be <3 if fewer players)
  rest: LeaderRow[]     // everyone else
}

/**
 * Map raw DB rows to view model, assign ranks (ties broken by exact_hits),
 * mark currentUser, and split into podium / rest.
 *
 * Assumes rows already arrive in descending order (total_points DESC,
 * exact_hits DESC) from the query — we simply assign rank numbers while
 * handling ties.
 *
 * @param previousRanks - mapa user_id → pozycja z poprzedniego dnia (z leaderboard_snapshots)
 */
export function rankRows(
  rows: RawLeaderRow[],
  currentUserId: string,
  previousRanks?: Map<string, number>,
): RankedLeaderboard {
  if (rows.length === 0) return { podium: [], rest: [] }

  const ranked: LeaderRow[] = []
  let rank = 1

  for (let i = 0; i < rows.length; i++) {
    const raw = rows[i]

    // Assign same rank to ties (same total_points AND exact_hits)
    if (i > 0) {
      const prev = rows[i - 1]
      const samePoints = (raw.total_points ?? 0) === (prev.total_points ?? 0)
      const sameExact = (raw.exact_hits ?? 0) === (prev.exact_hits ?? 0)
      if (!samePoints || !sameExact) {
        rank = i + 1
      }
    }

    const previousRank = previousRanks?.get(raw.user_id ?? "") ?? null
    ranked.push({
      userId: raw.user_id ?? "",
      nick: raw.nick ?? "Gracz",
      totalPoints: raw.total_points ?? 0,
      exactHits: raw.exact_hits ?? 0,
      resultHits: raw.result_hits ?? 0,
      predictedCount: raw.predicted_count ?? 0,
      championBonus: raw.champion_bonus ?? 0,
      rank,
      isCurrentUser: raw.user_id === currentUserId,
      rankChange: previousRank !== null ? previousRank - rank : null,
    })
  }

  const podium = ranked.slice(0, 3)
  const rest = ranked.slice(3)

  return { podium, rest }
}
