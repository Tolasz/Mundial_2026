export interface TeamVM {
  id: string
  name: string
  shortName: string
  flagUrl: string
}

export interface OtherPrediction {
  nick: string
  homePick: number
  awayPick: number
  pointsAwarded: number | null
}

export type PredictionStatus = "empty" | "saved" | "locked"
export type SortDir = "asc" | "desc" | "grouped"
export type StatusFilter = "all" | PredictionStatus

export interface FilterState {
  group: string // "all" or group letter "A"–"L"
  status: StatusFilter
  query: string
}

export interface MatchVM {
  id: string
  group: string | null
  stage: string
  roundLabel: string | null
  kickoffAt: string
  home: TeamVM
  away: TeamVM
  prediction: { homePick: number; awayPick: number } | null
  isLocked: boolean
  predictionStatus: PredictionStatus
  otherPredictions: OtherPrediction[]
}

export interface PendingKnockoutVM {
  id: string
  stage: string
  roundLabel: string | null
  kickoffAt: string
}

/** Derive predictionStatus from prediction + isLocked. */
export function deriveMatchStatus(
  match: Pick<MatchVM, "prediction" | "isLocked">,
): PredictionStatus {
  if (match.isLocked) return "locked"
  if (match.prediction !== null) return "saved"
  return "empty"
}

/** Filter matches by group letter, prediction status, and team name query. */
export function filterMatches(
  matches: MatchVM[],
  { group, status, query }: FilterState,
): MatchVM[] {
  return matches.filter((m) => {
    if (group !== "all" && m.group !== group) return false
    if (status !== "all" && m.predictionStatus !== status) return false
    if (query.trim()) {
      const q = query.toLowerCase().trim()
      const homeMatch =
        m.home.name.toLowerCase().includes(q) ||
        m.home.shortName.toLowerCase().includes(q)
      const awayMatch =
        m.away.name.toLowerCase().includes(q) ||
        m.away.shortName.toLowerCase().includes(q)
      if (!homeMatch && !awayMatch) return false
    }
    return true
  })
}

/** Stable sort by kickoffAt. Returns a new array (does not mutate input).
 * When dir is "grouped", the original order is preserved (grouping is done by the board). */
export function sortMatches(matches: MatchVM[], dir: SortDir): MatchVM[] {
  if (dir === "grouped") return [...matches]
  return [...matches].sort((a, b) => {
    const diff =
      new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime()
    return dir === "asc" ? diff : -diff
  })
}
