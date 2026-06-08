// Dane zapasowe (fallback) seedu — używane gdy football-data.org jest niedostępne.
// 48 drużyn w 12 grupach (A–L) + generator 72 meczów fazy grupowej (round-robin).
// UWAGA: skład/losowanie MŚ 2026 jest orientacyjny — admin może go skorygować.

export interface SeedTeam {
  externalId: string
  name: string
  shortName: string
  flagUrl: string
  group: string
}

export interface SeedMatch {
  externalId: string
  stage: "group"
  group: string
  kickoffAt: string // ISO 8601 (UTC)
  homeExternalId: string
  awayExternalId: string
  roundLabel: string
}

// 12 grup po 4 drużyny. external_id = `seed-${TLA}`.
const GROUP_TEAMS: Record<string, [string, string][]> = {
  A: [["Mexico", "MEX"], ["Croatia", "CRO"], ["Ecuador", "ECU"], ["Saudi Arabia", "KSA"]],
  B: [["Canada", "CAN"], ["Belgium", "BEL"], ["Morocco", "MAR"], ["Japan", "JPN"]],
  C: [["USA", "USA"], ["Netherlands", "NED"], ["Senegal", "SEN"], ["South Korea", "KOR"]],
  D: [["Argentina", "ARG"], ["Denmark", "DEN"], ["Tunisia", "TUN"], ["Australia", "AUS"]],
  E: [["France", "FRA"], ["Switzerland", "SUI"], ["Nigeria", "NGA"], ["Iran", "IRN"]],
  F: [["Brazil", "BRA"], ["Serbia", "SRB"], ["Ghana", "GHA"], ["Costa Rica", "CRC"]],
  G: [["England", "ENG"], ["Poland", "POL"], ["Egypt", "EGY"], ["Qatar", "QAT"]],
  H: [["Spain", "ESP"], ["Uruguay", "URU"], ["Cameroon", "CMR"], ["New Zealand", "NZL"]],
  I: [["Portugal", "POR"], ["Sweden", "SWE"], ["Algeria", "ALG"], ["Panama", "PAN"]],
  J: [["Germany", "GER"], ["Colombia", "COL"], ["Ivory Coast", "CIV"], ["Jamaica", "JAM"]],
  K: [["Italy", "ITA"], ["Peru", "PER"], ["Mali", "MLI"], ["Honduras", "HON"]],
  L: [["Norway", "NOR"], ["Chile", "CHI"], ["South Africa", "RSA"], ["United Arab Emirates", "UAE"]],
}

export const FALLBACK_TEAMS: SeedTeam[] = Object.entries(GROUP_TEAMS).flatMap(
  ([group, teams]) =>
    teams.map(([name, tla]) => ({
      externalId: `seed-${tla}`,
      name,
      shortName: tla,
      flagUrl: "",
      group,
    })),
)

// Harmonogram round-robin dla 4 drużyn (indeksy 0–3), 3 kolejki po 2 mecze.
const ROUND_ROBIN: [number, number][][] = [
  [[0, 1], [2, 3]], // kolejka 1
  [[0, 2], [3, 1]], // kolejka 2
  [[3, 0], [1, 2]], // kolejka 3
]

const SEED_BASE_KICKOFF = Date.UTC(2026, 5, 11, 16, 0, 0) // 2026-06-11T16:00:00Z
const HOURS = 60 * 60 * 1000

/** Generuje 72 mecze grupowe (idempotentne external_id, rosnące kickoff_at). */
export function buildFallbackMatches(): SeedMatch[] {
  const matches: SeedMatch[] = []
  let slot = 0

  // Najpierw wszystkie mecze kolejki 1, potem 2, potem 3 — chronologicznie.
  ROUND_ROBIN.forEach((round, matchday) => {
    for (const [group, teams] of Object.entries(GROUP_TEAMS)) {
      round.forEach(([homeIdx, awayIdx], idxInRound) => {
        const matchNo = matchday * 2 + idxInRound + 1 // 1..6 w obrębie grupy
        matches.push({
          externalId: `seed-${group}-${matchNo}`,
          stage: "group",
          group,
          kickoffAt: new Date(SEED_BASE_KICKOFF + slot * 2 * HOURS).toISOString(),
          homeExternalId: `seed-${teams[homeIdx][1]}`,
          awayExternalId: `seed-${teams[awayIdx][1]}`,
          roundLabel: `Grupa ${group} — kolejka ${matchday + 1}`,
        })
        slot++
      })
    }
  })

  return matches
}
