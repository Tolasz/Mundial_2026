// Pure dashboard logic — no React / Supabase dependencies.

export interface DashboardTeamVM {
  id: string
  name: string
  shortName: string
  flagUrl: string
}

export interface DashboardMatchVM {
  id: string
  kickoffAt: string
  stage: string
  group: string | null
  roundLabel: string | null
  home: DashboardTeamVM | null
  away: DashboardTeamVM | null
}

export interface DashboardPredictionVM {
  matchId: string
}

/**
 * Returns up to `limit` upcoming (not-yet-kicked-off) matches with known teams,
 * sorted by kickoff ascending.
 */
export function upcomingMatches(
  matches: DashboardMatchVM[],
  now: Date,
  limit: number,
): DashboardMatchVM[] {
  return matches
    .filter((m) => new Date(m.kickoffAt) > now && m.home !== null && m.away !== null)
    .sort((a, b) => new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime())
    .slice(0, limit)
}

/**
 * Returns open matches (kickoff > now, both teams known) that the user has NOT predicted yet.
 */
export function missingPredictions(
  matches: DashboardMatchVM[],
  predictions: DashboardPredictionVM[],
  now: Date,
): DashboardMatchVM[] {
  const predictedIds = new Set(predictions.map((p) => p.matchId))
  return matches.filter(
    (m) =>
      new Date(m.kickoffAt) > now &&
      m.home !== null &&
      m.away !== null &&
      !predictedIds.has(m.id),
  )
}

/**
 * Returns a human-readable Polish countdown label for a kickoff time.
 * Examples: "za 2 godz.", "jutro 18:00", "dziś 20:45", "12.06 16:00"
 */
export function countdownLabel(kickoffAt: string, now: Date): string {
  const kickoff = new Date(kickoffAt)
  const diffMs = kickoff.getTime() - now.getTime()

  if (diffMs <= 0) return "Trwa"

  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))

  const hh = kickoff.getUTCHours().toString().padStart(2, "0")
  const mm = kickoff.getUTCMinutes().toString().padStart(2, "0")
  const timeStr = `${hh}:${mm}`

  // Within 60 minutes
  if (diffMinutes < 60) {
    return `za ${diffMinutes} min`
  }

  // Within 24 hours
  if (diffHours < 24) {
    return `za ${diffHours} godz.`
  }

  // Compare UTC calendar dates
  const nowDay = now.getUTCDate()
  const kickoffDay = kickoff.getUTCDate()
  const nowMonth = now.getUTCMonth()
  const kickoffMonth = kickoff.getUTCMonth()
  const nowYear = now.getUTCFullYear()
  const kickoffYear = kickoff.getUTCFullYear()

  const isToday =
    nowDay === kickoffDay && nowMonth === kickoffMonth && nowYear === kickoffYear

  if (isToday) {
    return `dziś ${timeStr}`
  }

  // Tomorrow (UTC)
  const tomorrow = new Date(Date.UTC(nowYear, nowMonth, nowDay + 1))
  const isTomorrow =
    kickoffDay === tomorrow.getUTCDate() &&
    kickoffMonth === tomorrow.getUTCMonth() &&
    kickoffYear === tomorrow.getUTCFullYear()

  if (isTomorrow) {
    return `jutro ${timeStr}`
  }

  // Further: "12.06 16:00"
  const day = kickoffDay.toString().padStart(2, "0")
  const month = (kickoffMonth + 1).toString().padStart(2, "0")
  return `${day}.${month} ${timeStr}`
}
