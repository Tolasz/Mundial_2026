import { describe, expect, it, vi } from "vitest"
import {
  findMatchingOddsEvent,
  mapOddsEvent,
  normalizeTeamName,
  OddsApi,
  type OddsEvent,
} from "./odds-api"

// ------------------------------------
// normalizeTeamName
// ------------------------------------

describe("normalizeTeamName", () => {
  it("lowercase i usuwa diakrytyki", () => {
    expect(normalizeTeamName("México")).toBe("mexico")
    expect(normalizeTeamName("Côte d'Ivoire")).toBe("cote divoire")
    expect(normalizeTeamName("Korea Republic")).toBe("korea republic")
  })

  it("usuwa znaki specjalne i normalizuje spacje", () => {
    expect(normalizeTeamName("United States")).toBe("united states")
    expect(normalizeTeamName("  Brazil  ")).toBe("brazil")
  })
})

// ------------------------------------
// mapOddsEvent
// ------------------------------------

const RAW_EVENT = {
  id: "abc123",
  sport_key: "soccer_fifa_world_cup",
  commence_time: "2026-06-15T18:00:00Z",
  home_team: "Brazil",
  away_team: "Argentina",
  bookmakers: [
    {
      key: "betclic",
      title: "Betclic",
      markets: [
        {
          key: "h2h",
          outcomes: [
            { name: "Brazil", price: 2.1 },
            { name: "Argentina", price: 3.5 },
            { name: "Draw", price: 3.0 },
          ],
        },
      ],
    },
  ],
}

describe("mapOddsEvent", () => {
  it("mapuje kursy z pierwszego bukmachera", () => {
    const ev = mapOddsEvent(RAW_EVENT)
    expect(ev.homeTeam).toBe("Brazil")
    expect(ev.awayTeam).toBe("Argentina")
    expect(ev.homeOdds).toBe(2.1)
    expect(ev.awayOdds).toBe(3.5)
    expect(ev.drawOdds).toBe(3.0)
    expect(ev.commenceTime).toBe("2026-06-15T18:00:00Z")
  })

  it("zwraca null dla brakujących kursów", () => {
    const noBookmakers = { ...RAW_EVENT, bookmakers: [] }
    const ev = mapOddsEvent(noBookmakers)
    expect(ev.homeOdds).toBeNull()
    expect(ev.drawOdds).toBeNull()
    expect(ev.awayOdds).toBeNull()
  })
})

// ------------------------------------
// findMatchingOddsEvent
// ------------------------------------

const SAMPLE_EVENT: OddsEvent = {
  id: "ev1",
  homeTeam: "Brazil",
  awayTeam: "Argentina",
  commenceTime: "2026-06-15T18:00:00Z",
  homeOdds: 2.1,
  drawOdds: 3.0,
  awayOdds: 3.5,
}

describe("findMatchingOddsEvent", () => {
  it("zwraca event przy dokładnym dopasowaniu nazw i czasu", () => {
    const result = findMatchingOddsEvent(
      "Brazil",
      "Argentina",
      "2026-06-15T18:00:00Z",
      [SAMPLE_EVENT],
    )
    expect(result).toBe(SAMPLE_EVENT)
  })

  it("zwraca event przy odwróconej orientacji", () => {
    const result = findMatchingOddsEvent(
      "Argentina",
      "Brazil",
      "2026-06-15T18:00:00Z",
      [SAMPLE_EVENT],
    )
    expect(result).toBe(SAMPLE_EVENT)
  })

  it("zwraca event przy częściowym dopasowaniu (jedna nazwa zawiera drugą)", () => {
    const eventWithLongName: OddsEvent = {
      ...SAMPLE_EVENT,
      awayTeam: "Argentina CF",
    }
    const result = findMatchingOddsEvent(
      "Brazil",
      "Argentina",
      "2026-06-15T18:00:00Z",
      [eventWithLongName],
    )
    // "argentina cf".includes("argentina") = true
    expect(result).toBe(eventWithLongName)
  })

  it("zwraca null dla różnicy czasu > 12h", () => {
    const result = findMatchingOddsEvent(
      "Brazil",
      "Argentina",
      "2026-06-14T05:00:00Z", // >12h różnicy
      [SAMPLE_EVENT],
    )
    expect(result).toBeNull()
  })

  it("zwraca null dla nieznanych drużyn", () => {
    const result = findMatchingOddsEvent(
      "Spain",
      "Germany",
      "2026-06-15T18:00:00Z",
      [SAMPLE_EVENT],
    )
    expect(result).toBeNull()
  })

  it("zwraca null dla pustej listy eventów", () => {
    const result = findMatchingOddsEvent("Brazil", "Argentina", "2026-06-15T18:00:00Z", [])
    expect(result).toBeNull()
  })
})

// ------------------------------------
// OddsApi.getOdds
// ------------------------------------

function mockFetch(body: unknown, status = 200) {
  return vi.fn(async () =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  )
}

describe("OddsApi.getOdds", () => {
  it("mapuje odpowiedź z API", async () => {
    const fetch = mockFetch([RAW_EVENT])
    const api = new OddsApi({ apiKey: "test-key", fetchFn: fetch })
    const events = await api.getOdds()
    expect(events).toHaveLength(1)
    expect(events[0].homeTeam).toBe("Brazil")
  })

  it("rzuca błąd przy statusie != 200", async () => {
    const fetch = mockFetch({ message: "Not found" }, 404)
    const api = new OddsApi({ apiKey: "test-key", fetchFn: fetch })
    await expect(api.getOdds()).rejects.toThrow("404")
  })

  it("rzuca przy braku apiKey", () => {
    expect(() => new OddsApi({ apiKey: "" })).toThrow("ODDS_API_KEY")
  })
})
