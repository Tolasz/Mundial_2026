// Pure group-standings logic — no React / Supabase dependencies.

export interface GroupTeamVM {
  id: string
  name: string
  shortName: string
  flagUrl: string
  group: string | null
}

export interface GroupMatchVM {
  group: string | null
  status: string
  homeTeamId: string | null
  awayTeamId: string | null
  homeScore: number | null
  awayScore: number | null
}

export interface GroupStandingRow {
  teamId: string
  name: string
  shortName: string
  flagUrl: string
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  goalDiff: number
  points: number
  position: number
}

export interface GroupStanding {
  group: string
  rows: GroupStandingRow[]
}

// ---------------------------------------------------------------------------
// FIFA tiebreaker helpers
// ---------------------------------------------------------------------------

interface H2HStats {
  points: number
  goalDiff: number
  goalsFor: number
}

/**
 * Compute head-to-head mini-table stats among a specific set of teams,
 * considering only finished matches between those teams within the given group.
 */
function computeH2HStats(
  teamIds: Set<string>,
  matches: GroupMatchVM[],
  group: string,
): Map<string, H2HStats> {
  const stats = new Map<string, H2HStats>()
  for (const id of teamIds) {
    stats.set(id, { points: 0, goalDiff: 0, goalsFor: 0 })
  }

  for (const match of matches) {
    if (match.group !== group) continue
    if (match.status !== "finished") continue
    if (match.homeScore === null || match.awayScore === null) continue
    if (!match.homeTeamId || !match.awayTeamId) continue
    if (!teamIds.has(match.homeTeamId) || !teamIds.has(match.awayTeamId)) continue

    const home = stats.get(match.homeTeamId)!
    const away = stats.get(match.awayTeamId)!

    home.goalsFor += match.homeScore
    home.goalDiff += match.homeScore - match.awayScore
    away.goalsFor += match.awayScore
    away.goalDiff += match.awayScore - match.homeScore

    if (match.homeScore > match.awayScore) {
      home.points += 3
    } else if (match.homeScore < match.awayScore) {
      away.points += 3
    } else {
      home.points += 1
      away.points += 1
    }
  }

  return stats
}

/**
 * Resolve a tie among rows with equal overall points using FIFA World Cup rules:
 *
 *  1. H2H points in matches between the tied teams
 *  2. H2H goal difference in matches between the tied teams
 *  3. H2H goals scored in matches between the tied teams
 *  4. If a sub-group is still equal, re-apply steps 1–3 exclusively to that sub-group
 *  5. Overall goal difference (all group matches)
 *  6. Overall goals scored
 *  7. Overall wins
 *  8. Name alphabetically (proxy for drawing of lots / FIFA ranking — not available)
 */
function resolveTie(
  rows: GroupStandingRow[],
  matches: GroupMatchVM[],
  group: string,
): GroupStandingRow[] {
  if (rows.length <= 1) return rows

  const teamIds = new Set(rows.map((r) => r.teamId))
  const h2h = computeH2HStats(teamIds, matches, group)

  const sorted = [...rows].sort((a, b) => {
    const ha = h2h.get(a.teamId)!
    const hb = h2h.get(b.teamId)!
    return hb.points - ha.points || hb.goalDiff - ha.goalDiff || hb.goalsFor - ha.goalsFor
  })

  const result: GroupStandingRow[] = []
  let i = 0
  while (i < sorted.length) {
    // Find the run of teams with identical H2H stats.
    let j = i + 1
    while (j < sorted.length) {
      const hi = h2h.get(sorted[i].teamId)!
      const hj = h2h.get(sorted[j].teamId)!
      if (hi.points !== hj.points || hi.goalDiff !== hj.goalDiff || hi.goalsFor !== hj.goalsFor)
        break
      j++
    }

    const subgroup = sorted.slice(i, j)
    if (subgroup.length === rows.length) {
      // H2H made no progress at all — fall back to overall stats.
      result.push(...resolveByOverall(subgroup))
    } else if (subgroup.length > 1) {
      // A smaller sub-group is still tied — re-apply FIFA H2H to it.
      result.push(...resolveTie(subgroup, matches, group))
    } else {
      result.push(...subgroup)
    }
    i = j
  }
  return result
}

/**
 * Last-resort ordering once H2H cannot separate teams:
 * overall GD → overall GF → overall wins → name alphabetically.
 * (Disciplinary points and FIFA ranking are not available in this system.)
 */
function resolveByOverall(rows: GroupStandingRow[]): GroupStandingRow[] {
  return [...rows].sort(
    (a, b) =>
      b.goalDiff - a.goalDiff ||
      b.goalsFor - a.goalsFor ||
      b.won - a.won ||
      a.name.localeCompare(b.name),
  )
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Compute group-stage standings from teams and matches.
 *
 * Only matches with status 'finished' and both scores present contribute.
 * Teams without a group are ignored.
 *
 * Tiebreaker order (FIFA World Cup regulations):
 *   1. Points
 *   2. H2H points among tied teams
 *   3. H2H goal difference among tied teams
 *   4. H2H goals scored among tied teams
 *   5. Re-apply 2–4 to any remaining sub-group (recursively)
 *   6. Overall goal difference
 *   7. Overall goals scored
 *   8. Overall wins
 *   9. Name (alphabetical) — proxy for drawing of lots / FIFA ranking
 *
 * Groups are returned sorted alphabetically by letter.
 */
export function computeGroupStandings(
  teams: GroupTeamVM[],
  matches: GroupMatchVM[],
): GroupStanding[] {
  // Initialize a row per team, bucketed by group.
  const rowsByGroup = new Map<string, Map<string, GroupStandingRow>>()

  for (const team of teams) {
    if (!team.group) continue
    if (!rowsByGroup.has(team.group)) {
      rowsByGroup.set(team.group, new Map())
    }
    rowsByGroup.get(team.group)!.set(team.id, {
      teamId: team.id,
      name: team.name,
      shortName: team.shortName,
      flagUrl: team.flagUrl,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDiff: 0,
      points: 0,
      position: 0,
    })
  }

  // Accumulate finished group matches.
  for (const match of matches) {
    if (match.status !== "finished") continue
    if (match.homeScore === null || match.awayScore === null) continue
    if (!match.group || !match.homeTeamId || !match.awayTeamId) continue

    const groupRows = rowsByGroup.get(match.group)
    if (!groupRows) continue

    const home = groupRows.get(match.homeTeamId)
    const away = groupRows.get(match.awayTeamId)
    if (!home || !away) continue

    home.played++
    away.played++
    home.goalsFor += match.homeScore
    home.goalsAgainst += match.awayScore
    away.goalsFor += match.awayScore
    away.goalsAgainst += match.homeScore

    if (match.homeScore > match.awayScore) {
      home.won++
      home.points += 3
      away.lost++
    } else if (match.homeScore < match.awayScore) {
      away.won++
      away.points += 3
      home.lost++
    } else {
      home.drawn++
      away.drawn++
      home.points += 1
      away.points += 1
    }
  }

  const standings: GroupStanding[] = []

  for (const [group, groupRows] of rowsByGroup) {
    const rows = [...groupRows.values()]

    for (const row of rows) {
      row.goalDiff = row.goalsFor - row.goalsAgainst
    }

    // Primary sort: points descending.
    rows.sort((a, b) => b.points - a.points)

    // Resolve ties group-by-group using FIFA rules.
    const resolved: GroupStandingRow[] = []
    let i = 0
    while (i < rows.length) {
      let j = i + 1
      while (j < rows.length && rows[j].points === rows[i].points) j++
      const tied = rows.slice(i, j)
      resolved.push(...(tied.length === 1 ? tied : resolveTie(tied, matches, group)))
      i = j
    }

    resolved.forEach((row, index) => {
      row.position = index + 1
    })

    standings.push({ group, rows: resolved })
  }

  standings.sort((a, b) => a.group.localeCompare(b.group))

  return standings
}
