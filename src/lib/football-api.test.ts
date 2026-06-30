import { describe, expect, it, vi } from "vitest"
import {
  FootballDataApi,
  mapGroup,
  mapMatchToFixture,
  mapMatchToResult,
  mapStage,
  mapStatus,
} from "./football-api"

// Pomocnik: zbuduj zamockowany fetch zwracający podaną odpowiedź JSON.
function mockFetch(body: unknown, init: { status?: number } = {}) {
  const status = init.status ?? 200
  return vi.fn(async () =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  )
}

const SAMPLE_MATCH = {
  id: 12345,
  utcDate: "2026-06-11T16:00:00Z",
  status: "SCHEDULED",
  stage: "GROUP_STAGE",
  group: "GROUP_A",
  homeTeam: {
    id: 1,
    name: "Mexico",
    shortName: "Mexico",
    tla: "MEX",
    crest: "https://crests.football-data.org/mex.png",
  },
  awayTeam: {
    id: 2,
    name: "Canada",
    shortName: "Canada",
    tla: "CAN",
    crest: "https://crests.football-data.org/can.png",
  },
  score: { fullTime: { home: null, away: null } },
}

describe("mapStatus", () => {
  it("mapuje statusy football-data.org na enum", () => {
    expect(mapStatus("SCHEDULED")).toBe("scheduled")
    expect(mapStatus("TIMED")).toBe("scheduled")
    expect(mapStatus("IN_PLAY")).toBe("live")
    expect(mapStatus("PAUSED")).toBe("live")
    expect(mapStatus("FINISHED")).toBe("finished")
    expect(mapStatus("POSTPONED")).toBe("postponed")
    expect(mapStatus("SUSPENDED")).toBe("postponed")
    expect(mapStatus("CANCELLED")).toBe("postponed")
    expect(mapStatus("WHATEVER")).toBe("scheduled")
  })
})

describe("mapStage", () => {
  it("mapuje fazy turnieju", () => {
    expect(mapStage("GROUP_STAGE")).toBe("group")
    expect(mapStage("LAST_32")).toBe("r32")
    expect(mapStage("LAST_16")).toBe("r16")
    expect(mapStage("QUARTER_FINALS")).toBe("qf")
    expect(mapStage("SEMI_FINALS")).toBe("sf")
    expect(mapStage("THIRD_PLACE")).toBe("third")
    expect(mapStage("FINAL")).toBe("final")
  })
})

describe("mapGroup", () => {
  it("wyciąga literę grupy", () => {
    expect(mapGroup("GROUP_A")).toBe("A")
    expect(mapGroup("GROUP_L")).toBe("L")
    expect(mapGroup(null)).toBeNull()
    expect(mapGroup("LAST_16")).toBeNull()
  })
})

describe("mapMatchToFixture", () => {
  it("mapuje mecz na FixtureDTO", () => {
    const fixture = mapMatchToFixture(SAMPLE_MATCH)
    expect(fixture.externalId).toBe("12345")
    expect(fixture.stage).toBe("group")
    expect(fixture.group).toBe("A")
    expect(fixture.kickoffAt).toBe("2026-06-11T16:00:00.000Z")
    expect(fixture.homeTeam).toEqual({
      externalId: "1",
      name: "Mexico",
      shortName: "MEX",
      flagUrl: "https://crests.football-data.org/mex.png",
      group: "A",
    })
    expect(fixture.awayTeam?.externalId).toBe("2")
  })

  it("zwraca null dla nieustalonej drużyny (puchar przed losowaniem)", () => {
    const tbd = {
      ...SAMPLE_MATCH,
      stage: "LAST_16",
      group: null,
      homeTeam: { id: null, name: null, shortName: null, tla: null, crest: null },
    }
    const fixture = mapMatchToFixture(tbd)
    expect(fixture.homeTeam).toBeNull()
    expect(fixture.awayTeam).not.toBeNull()
    expect(fixture.stage).toBe("r16")
  })
})

describe("mapMatchToResult", () => {
  it("mapuje zakończony mecz na ResultDTO", () => {
    const finished = {
      ...SAMPLE_MATCH,
      status: "FINISHED",
      score: { fullTime: { home: 2, away: 1 } },
    }
    expect(mapMatchToResult(finished)).toEqual({
      externalId: "12345",
      homeScore: 2,
      awayScore: 1,
      status: "finished",
    })
  })

  it("zwraca null score dla meczu bez wyniku", () => {
    expect(mapMatchToResult(SAMPLE_MATCH)).toEqual({
      externalId: "12345",
      homeScore: null,
      awayScore: null,
      status: "scheduled",
    })
  })

  it("używa wyniku z 90. minuty (regularTime) dla meczu rozstrzygniętego w karnych", () => {
    // football-data.org: fullTime zawiera karne (regular 1-1 + karne 3-4 => 4-5),
    // ale punktacja ma liczyć wynik z 90 minuty: 1-1.
    const penalties = {
      ...SAMPLE_MATCH,
      status: "FINISHED",
      score: {
        duration: "PENALTY_SHOOTOUT",
        fullTime: { home: 4, away: 5 },
        regularTime: { home: 1, away: 1 },
      },
    }
    expect(mapMatchToResult(penalties)).toEqual({
      externalId: "12345",
      homeScore: 1,
      awayScore: 1,
      status: "finished",
    })
  })

  it("używa wyniku z 90. minuty (regularTime) dla meczu rozstrzygniętego w dogrywce", () => {
    const extraTime = {
      ...SAMPLE_MATCH,
      status: "FINISHED",
      score: {
        duration: "EXTRA_TIME",
        fullTime: { home: 2, away: 1 },
        regularTime: { home: 1, away: 1 },
      },
    }
    expect(mapMatchToResult(extraTime)).toEqual({
      externalId: "12345",
      homeScore: 1,
      awayScore: 1,
      status: "finished",
    })
  })
})

describe("FootballDataApi", () => {
  it("getFixtures pobiera i mapuje mecze z nagłówkiem X-Auth-Token", async () => {
    const fetchFn = mockFetch({ matches: [SAMPLE_MATCH] })
    const api = new FootballDataApi({ apiKey: "secret", fetchFn })

    const fixtures = await api.getFixtures()

    expect(fetchFn).toHaveBeenCalledTimes(1)
    const [url, init] = fetchFn.mock.calls[0]
    expect(url).toBe("https://api.football-data.org/v4/competitions/WC/matches")
    expect((init as RequestInit).headers).toMatchObject({
      "X-Auth-Token": "secret",
    })
    expect(fixtures).toHaveLength(1)
    expect(fixtures[0].externalId).toBe("12345")
  })

  it("getResults mapuje wyniki", async () => {
    const fetchFn = mockFetch({
      matches: [
        {
          ...SAMPLE_MATCH,
          status: "FINISHED",
          score: { fullTime: { home: 0, away: 0 } },
        },
      ],
    })
    const api = new FootballDataApi({ apiKey: "secret", fetchFn })

    const results = await api.getResults()
    expect(results[0]).toEqual({
      externalId: "12345",
      homeScore: 0,
      awayScore: 0,
      status: "finished",
    })
  })

  it("ponawia próbę przy 429 i ostatecznie zwraca dane", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(new Response("", { status: 429 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ matches: [SAMPLE_MATCH] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      )
    const api = new FootballDataApi({
      apiKey: "secret",
      fetchFn,
      retryDelayMs: 0,
    })

    const fixtures = await api.getFixtures()
    expect(fetchFn).toHaveBeenCalledTimes(2)
    expect(fixtures).toHaveLength(1)
  })

  it("rzuca czytelny błąd po wyczerpaniu prób (5xx)", async () => {
    const fetchFn = vi.fn(async () => new Response("", { status: 503 }))
    const api = new FootballDataApi({
      apiKey: "secret",
      fetchFn,
      maxRetries: 2,
      retryDelayMs: 0,
    })

    await expect(api.getResults()).rejects.toThrow(/football-data\.org/)
    expect(fetchFn).toHaveBeenCalledTimes(3)
  })

  it("wymaga apiKey", () => {
    expect(() => new FootballDataApi({ apiKey: "" })).toThrow(/apiKey/)
  })
})
