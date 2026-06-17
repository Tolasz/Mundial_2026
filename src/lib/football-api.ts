// Adapter źródła danych piłkarskich.
// Definiuje interfejs FootballApi + implementację dla football-data.org.
// Sieć jest wstrzykiwana (fetchFn) — w testach mockujemy bez realnych zapytań.

import type { MatchStage, MatchStatus } from "@/types/db"

// ------------------------------------
// DTO
// ------------------------------------

export type FixtureGroup = string | null

export interface FixtureTeamDTO {
  externalId: string
  name: string
  shortName: string
  flagUrl: string
  group: FixtureGroup
}

export interface FixtureDTO {
  externalId: string
  stage: MatchStage
  group: FixtureGroup
  kickoffAt: string // ISO 8601 (UTC)
  homeTeam: FixtureTeamDTO | null
  awayTeam: FixtureTeamDTO | null
  roundLabel: string | null
}

export interface ResultDTO {
  externalId: string
  homeScore: number | null
  awayScore: number | null
  status: MatchStatus
}

/** Zdarzenie gola z meczu (dostępne na darmowym tierze via /v4/matches/{id}) */
export interface GoalEvent {
  minute: number | null
  extraTime: number | null
  type: string | null // "REGULAR" | "OWN_GOAL" | "PENALTY"
  scorerName: string | null
  assistName: string | null
  teamName: string | null
}

/** Kartka z meczu */
export interface BookingEvent {
  minute: number | null
  playerName: string | null
  teamName: string | null
  card: string | null // "YELLOW_CARD" | "RED_CARD" | "YELLOW_RED_CARD"
}

/** Szczegóły meczu (gole + kartki) */
export interface MatchDetails {
  goals: GoalEvent[]
  bookings: BookingEvent[]
}

export interface FootballApi {
  /** Terminarz: drużyny, grupa, kickoff, external_id. */
  getFixtures(): Promise<FixtureDTO[]>
  /** Wyniki: external_id, home/away score, status. */
  getResults(): Promise<ResultDTO[]>
  /** Szczegóły zakończonego meczu: gole, kartki. Graceful — zwraca puste tablice przy błędzie. */
  getMatchDetails(externalId: string): Promise<MatchDetails>
}

// ------------------------------------
// Surowe typy odpowiedzi football-data.org (/v4/competitions/{code}/matches)
// ------------------------------------

interface FdTeam {
  id: number | null
  name: string | null
  shortName: string | null
  tla: string | null
  crest: string | null
}

interface FdScore {
  fullTime?: { home: number | null; away: number | null }
}

interface FdMatch {
  id: number
  utcDate: string
  status: string
  stage: string
  group: string | null
  homeTeam: FdTeam
  awayTeam: FdTeam
  score: FdScore
}

interface FdMatchesResponse {
  matches: FdMatch[]
}

// Typy dla endpointu szczegółów meczu /v4/matches/{id}

interface FdPerson {
  id: number | null
  name: string | null
}

interface FdGoal {
  minute: number | null
  extraTime: number | null
  type: string | null
  team: { id: number | null; name: string | null } | null
  scorer: FdPerson | null
  assist: FdPerson | null
}

interface FdBooking {
  minute: number | null
  team: { id: number | null; name: string | null } | null
  player: FdPerson | null
  card: string | null
}

interface FdMatchDetailResponse {
  match: {
    goals: FdGoal[] | null
    bookings: FdBooking[] | null
  }
}

// ------------------------------------
// Mapowanie (eksportowane do testów)
// ------------------------------------

/** Mapuje status football-data.org na nasz enum. */
export function mapStatus(raw: string): MatchStatus {
  switch (raw) {
    case "IN_PLAY":
    case "PAUSED":
      return "live"
    case "FINISHED":
      return "finished"
    case "POSTPONED":
    case "SUSPENDED":
    case "CANCELLED":
      return "postponed"
    case "SCHEDULED":
    case "TIMED":
    default:
      return "scheduled"
  }
}

/** Mapuje stage football-data.org na nasz enum. */
export function mapStage(raw: string): MatchStage {
  switch (raw) {
    case "LAST_32":
      return "r32"
    case "LAST_16":
      return "r16"
    case "QUARTER_FINALS":
      return "qf"
    case "SEMI_FINALS":
      return "sf"
    case "FINAL":
      return "final"
    case "GROUP_STAGE":
    default:
      return "group"
  }
}

/** "GROUP_A" -> "A"; cokolwiek innego -> null. */
export function mapGroup(raw: string | null): FixtureGroup {
  if (!raw) return null
  const match = /^GROUP_([A-L])$/.exec(raw)
  return match ? match[1] : null
}

function mapTeam(raw: FdTeam, group: FixtureGroup): FixtureTeamDTO | null {
  if (raw.id == null || !raw.name) return null
  return {
    externalId: String(raw.id),
    name: raw.name,
    shortName: raw.tla ?? raw.shortName ?? raw.name.slice(0, 3).toUpperCase(),
    flagUrl: raw.crest ?? "",
    group,
  }
}

export function mapMatchToFixture(m: FdMatch): FixtureDTO {
  const group = mapGroup(m.group)
  return {
    externalId: String(m.id),
    stage: mapStage(m.stage),
    group,
    kickoffAt: new Date(m.utcDate).toISOString(),
    homeTeam: mapTeam(m.homeTeam, group),
    awayTeam: mapTeam(m.awayTeam, group),
    roundLabel: m.group ?? m.stage ?? null,
  }
}

export function mapMatchToResult(m: FdMatch): ResultDTO {
  const full = m.score?.fullTime
  return {
    externalId: String(m.id),
    homeScore: full?.home ?? null,
    awayScore: full?.away ?? null,
    status: mapStatus(m.status),
  }
}

// ------------------------------------
// Implementacja: football-data.org
// ------------------------------------

export type FetchFn = typeof fetch

export interface FootballDataApiOptions {
  apiKey: string
  /** Wstrzykiwany fetch (do testów). Domyślnie globalny fetch. */
  fetchFn?: FetchFn
  baseUrl?: string
  /** Kod turnieju w football-data.org (World Cup = "WC"). */
  competition?: string
  maxRetries?: number
  /** Bazowe opóźnienie backoffu w ms (domyślnie 500). */
  retryDelayMs?: number
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export class FootballDataApi implements FootballApi {
  private readonly apiKey: string
  private readonly fetchFn: FetchFn
  private readonly baseUrl: string
  private readonly competition: string
  private readonly maxRetries: number
  private readonly retryDelayMs: number

  constructor(opts: FootballDataApiOptions) {
    if (!opts.apiKey) {
      throw new Error("FootballDataApi: brak apiKey (FOOTBALL_API_KEY).")
    }
    this.apiKey = opts.apiKey
    this.fetchFn = opts.fetchFn ?? fetch
    this.baseUrl = opts.baseUrl ?? "https://api.football-data.org/v4"
    this.competition = opts.competition ?? "WC"
    this.maxRetries = opts.maxRetries ?? 3
    this.retryDelayMs = opts.retryDelayMs ?? 500
  }

  private async fetchMatches(): Promise<FdMatch[]> {
    const url = `${this.baseUrl}/competitions/${this.competition}/matches`

    let lastError: unknown = null
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const res = await this.fetchFn(url, {
          headers: { "X-Auth-Token": this.apiKey },
        })

        // 429 / 5xx — przejściowe; ponawiamy z backoffem.
        if (res.status === 429 || res.status >= 500) {
          lastError = new Error(
            `football-data.org odpowiedziało ${res.status} (${res.statusText}).`,
          )
          if (attempt < this.maxRetries) {
            await sleep(this.retryDelayMs * 2 ** attempt)
            continue
          }
          throw lastError
        }

        if (!res.ok) {
          throw new Error(
            `football-data.org: błąd ${res.status} (${res.statusText}).`,
          )
        }

        const data = (await res.json()) as FdMatchesResponse
        return data.matches ?? []
      } catch (err) {
        lastError = err
        // Błąd sieci — ponawiamy, jeśli mamy jeszcze próby.
        if (attempt < this.maxRetries) {
          await sleep(this.retryDelayMs * 2 ** attempt)
          continue
        }
        break
      }
    }

    throw new Error(
      `Nie udało się pobrać danych z football-data.org po ${this.maxRetries + 1} próbach: ${
        lastError instanceof Error ? lastError.message : String(lastError)
      }`,
    )
  }

  async getFixtures(): Promise<FixtureDTO[]> {
    const matches = await this.fetchMatches()
    return matches.map(mapMatchToFixture)
  }

  async getResults(): Promise<ResultDTO[]> {
    const matches = await this.fetchMatches()
    return matches.map(mapMatchToResult)
  }

  async getMatchDetails(externalId: string): Promise<MatchDetails> {
    const url = `${this.baseUrl}/matches/${externalId}`
    try {
      const res = await this.fetchFn(url, {
        headers: { "X-Auth-Token": this.apiKey },
      })

      if (!res.ok) {
        // Nie rzucamy — graceful fallback
        return { goals: [], bookings: [] }
      }

      const data = (await res.json()) as FdMatchDetailResponse
      const match = data?.match

      const goals: GoalEvent[] = (match?.goals ?? []).map((g) => ({
        minute: g.minute ?? null,
        extraTime: g.extraTime ?? null,
        type: g.type ?? null,
        scorerName: g.scorer?.name ?? null,
        assistName: g.assist?.name ?? null,
        teamName: g.team?.name ?? null,
      }))

      const bookings: BookingEvent[] = (match?.bookings ?? []).map((b) => ({
        minute: b.minute ?? null,
        playerName: b.player?.name ?? null,
        teamName: b.team?.name ?? null,
        card: b.card ?? null,
      }))

      return { goals, bookings }
    } catch {
      // Błąd sieci lub parsowania — graceful fallback
      return { goals: [], bookings: [] }
    }
  }
}

// ------------------------------------
// Fabryka na podstawie env
// ------------------------------------

export function createFootballApi(
  overrides: Partial<FootballDataApiOptions> = {},
): FootballApi {
  const provider = process.env.FOOTBALL_API_PROVIDER ?? "football-data"
  if (provider !== "football-data") {
    throw new Error(`Nieobsługiwany FOOTBALL_API_PROVIDER: ${provider}`)
  }
  return new FootballDataApi({
    apiKey: process.env.FOOTBALL_API_KEY ?? "",
    ...overrides,
  })
}
