// Klient The Odds API.
// Pobiera kursy 1X2 (h2h) dla turnieju soccer_fifa_world_cup, region eu.
// fetchFn wstrzykiwany do testów (wzorzec z football-api.ts).

export type FetchFn = typeof fetch

export interface OddsApiOptions {
  apiKey: string
  fetchFn?: FetchFn
  baseUrl?: string
  sport?: string
  regions?: string
  markets?: string
}

export interface OddsEvent {
  id: string
  homeTeam: string
  awayTeam: string
  commenceTime: string // ISO 8601
  homeOdds: number | null
  drawOdds: number | null
  awayOdds: number | null
}

// ------------------------------------
// Surowe typy odpowiedzi The Odds API
// ------------------------------------

interface OddsApiOutcome {
  name: string
  price: number
}

interface OddsApiMarket {
  key: string
  outcomes: OddsApiOutcome[]
}

interface OddsApiBookmaker {
  key: string
  title: string
  markets: OddsApiMarket[]
}

interface OddsApiEvent {
  id: string
  sport_key: string
  commence_time: string
  home_team: string
  away_team: string
  bookmakers: OddsApiBookmaker[]
}

// ------------------------------------
// Mapowanie
// ------------------------------------

function extractH2HOdds(event: OddsApiEvent): {
  home: number | null
  draw: number | null
  away: number | null
} {
  // Używamy pierwszego bukmachera, który ma rynek h2h
  for (const bm of event.bookmakers ?? []) {
    const market = bm.markets?.find((m) => m.key === "h2h")
    if (!market) continue

    const homeOutcome = market.outcomes.find((o) => o.name === event.home_team)
    const awayOutcome = market.outcomes.find((o) => o.name === event.away_team)
    const drawOutcome = market.outcomes.find((o) => o.name === "Draw")

    if (homeOutcome && awayOutcome) {
      return {
        home: homeOutcome.price,
        draw: drawOutcome?.price ?? null,
        away: awayOutcome.price,
      }
    }
  }
  return { home: null, draw: null, away: null }
}

export function mapOddsEvent(raw: OddsApiEvent): OddsEvent {
  const odds = extractH2HOdds(raw)
  return {
    id: raw.id,
    homeTeam: raw.home_team,
    awayTeam: raw.away_team,
    commenceTime: raw.commence_time,
    homeOdds: odds.home,
    drawOdds: odds.draw,
    awayOdds: odds.away,
  }
}

// ------------------------------------
// Fuzzy matching
// ------------------------------------

/** Normalizuje nazwę drużyny do porównania: małe litery, bez diakrytyków, bez znaków spec. */
export function normalizeTeamName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

/**
 * Szuka najlepszego dopasowania OddsEvent dla meczu z bazy:
 * - porównanie nazw drużyn (dokładne lub częściowe, obie orientacje)
 * - okno czasu ±12h
 * Zwraca null jeśli brak dopasowania.
 */
export function findMatchingOddsEvent(
  homeTeamName: string,
  awayTeamName: string,
  kickoffAt: string,
  events: OddsEvent[],
): OddsEvent | null {
  const kickoff = new Date(kickoffAt).getTime()
  const windowMs = 12 * 60 * 60 * 1000 // ±12h

  const normHome = normalizeTeamName(homeTeamName)
  const normAway = normalizeTeamName(awayTeamName)

  for (const ev of events) {
    const evTime = new Date(ev.commenceTime).getTime()
    if (Math.abs(evTime - kickoff) > windowMs) continue

    const evHome = normalizeTeamName(ev.homeTeam)
    const evAway = normalizeTeamName(ev.awayTeam)

    // Dopasowanie dokładne
    if (evHome === normHome && evAway === normAway) return ev
    // Odwrócona orientacja (Odds API może mieć home/away inaczej)
    if (evHome === normAway && evAway === normHome) return ev
    // Dopasowanie częściowe (jedna nazwa zawiera drugą)
    if (
      (evHome.includes(normHome) || normHome.includes(evHome)) &&
      (evAway.includes(normAway) || normAway.includes(evAway))
    )
      return ev
    if (
      (evHome.includes(normAway) || normAway.includes(evHome)) &&
      (evAway.includes(normHome) || normHome.includes(evAway))
    )
      return ev
  }
  return null
}

// ------------------------------------
// Implementacja: OddsApi
// ------------------------------------

export class OddsApi {
  private readonly apiKey: string
  private readonly fetchFn: FetchFn
  private readonly baseUrl: string
  private readonly sport: string
  private readonly regions: string
  private readonly markets: string

  constructor(opts: OddsApiOptions) {
    if (!opts.apiKey) throw new Error("OddsApi: brak apiKey (ODDS_API_KEY).")
    this.apiKey = opts.apiKey
    this.fetchFn = opts.fetchFn ?? fetch
    this.baseUrl = opts.baseUrl ?? "https://api.the-odds-api.com/v4"
    this.sport = opts.sport ?? "soccer_fifa_world_cup"
    this.regions = opts.regions ?? "eu"
    this.markets = opts.markets ?? "h2h"
  }

  async getOdds(): Promise<OddsEvent[]> {
    const url = new URL(`${this.baseUrl}/sports/${this.sport}/odds`)
    url.searchParams.set("regions", this.regions)
    url.searchParams.set("markets", this.markets)
    url.searchParams.set("apiKey", this.apiKey)

    const res = await this.fetchFn(url.toString())
    if (!res.ok) {
      throw new Error(
        `The Odds API: błąd ${res.status} (${res.statusText}).`,
      )
    }
    const data = (await res.json()) as OddsApiEvent[]
    return (data ?? []).map(mapOddsEvent)
  }
}

// ------------------------------------
// Fabryka na podstawie env
// ------------------------------------

export function createOddsApi(overrides: Partial<OddsApiOptions> = {}): OddsApi {
  return new OddsApi({
    apiKey: process.env.ODDS_API_KEY ?? "",
    ...overrides,
  })
}
