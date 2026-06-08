// Seed bazy: drużyny + 72 mecze fazy grupowej.
// Uruchom: pnpm seed   (ładuje .env.local, używa SUPABASE_SERVICE_ROLE_KEY).
// Idempotentny: ponowne uruchomienie nie duplikuje (dopasowanie po external_id).
//
// Źródło danych: football-data.org (jeśli dostępne) z fallbackiem na zaszytą listę.

import { createClient } from "@supabase/supabase-js"
import type { Database } from "../src/types/db"
import { createFootballApi, type FixtureDTO } from "../src/lib/football-api"
import {
  buildFallbackMatches,
  FALLBACK_TEAMS,
  type SeedMatch,
  type SeedTeam,
} from "./fallback-data"

type Supabase = ReturnType<typeof createClient<Database>>

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Brak zmiennej środowiskowej: ${name}`)
  }
  return value
}

// ------------------------------------
// Budowanie danych seedu z API (faza grupowa) lub fallbacku
// ------------------------------------

interface SeedData {
  teams: SeedTeam[]
  matches: SeedMatch[]
  source: "football-data.org" | "fallback"
}

function buildFromFixtures(fixtures: FixtureDTO[]): SeedData {
  const groupFixtures = fixtures.filter(
    (f) => f.stage === "group" && f.homeTeam && f.awayTeam && f.group,
  )

  if (groupFixtures.length === 0) {
    throw new Error("API nie zwróciło meczów fazy grupowej.")
  }

  const teamMap = new Map<string, SeedTeam>()
  const matches: SeedMatch[] = []

  for (const f of groupFixtures) {
    const home = f.homeTeam!
    const away = f.awayTeam!
    const group = f.group!

    for (const t of [home, away]) {
      if (!teamMap.has(t.externalId)) {
        teamMap.set(t.externalId, {
          externalId: t.externalId,
          name: t.name,
          shortName: t.shortName,
          flagUrl: t.flagUrl,
          group: t.group ?? group,
        })
      }
    }

    matches.push({
      externalId: f.externalId,
      stage: "group",
      group,
      kickoffAt: f.kickoffAt,
      homeExternalId: home.externalId,
      awayExternalId: away.externalId,
      roundLabel: f.roundLabel ?? `Grupa ${group}`,
    })
  }

  return {
    teams: [...teamMap.values()],
    matches,
    source: "football-data.org",
  }
}

async function loadSeedData(): Promise<SeedData> {
  try {
    const api = createFootballApi()
    const fixtures = await api.getFixtures()
    const data = buildFromFixtures(fixtures)
    console.log(
      `Pobrano dane z football-data.org: ${data.teams.length} drużyn, ${data.matches.length} meczów.`,
    )
    return data
  } catch (err) {
    console.warn(
      `football-data.org niedostępne (${
        err instanceof Error ? err.message : String(err)
      }). Używam danych zapasowych.`,
    )
    return {
      teams: FALLBACK_TEAMS,
      matches: buildFallbackMatches(),
      source: "fallback",
    }
  }
}

// ------------------------------------
// Persystencja (idempotentna, dopasowanie po external_id)
// ------------------------------------

async function upsertTeams(
  sb: Supabase,
  teams: SeedTeam[],
): Promise<Map<string, string>> {
  const { data: existing, error } = await sb
    .from("teams")
    .select("id, external_id")
  if (error) throw error

  const idByExt = new Map<string, string>()
  for (const row of existing ?? []) {
    if (row.external_id) idByExt.set(row.external_id, row.id)
  }

  const toInsert: Database["public"]["Tables"]["teams"]["Insert"][] = []

  for (const t of teams) {
    const fields = {
      name: t.name,
      short_name: t.shortName,
      flag_url: t.flagUrl,
      group: t.group,
      external_id: t.externalId,
    }
    const id = idByExt.get(t.externalId)
    if (id) {
      const { error: updErr } = await sb.from("teams").update(fields).eq("id", id)
      if (updErr) throw updErr
    } else {
      toInsert.push(fields)
    }
  }

  if (toInsert.length > 0) {
    const { data: inserted, error: insErr } = await sb
      .from("teams")
      .insert(toInsert)
      .select("id, external_id")
    if (insErr) throw insErr
    for (const row of inserted ?? []) {
      if (row.external_id) idByExt.set(row.external_id, row.id)
    }
  }

  return idByExt
}

async function upsertMatches(
  sb: Supabase,
  matches: SeedMatch[],
  teamIdByExt: Map<string, string>,
): Promise<{ inserted: number; updated: number }> {
  const { data: existing, error } = await sb
    .from("matches")
    .select("id, external_id")
  if (error) throw error

  const idByExt = new Map<string, string>()
  for (const row of existing ?? []) {
    if (row.external_id) idByExt.set(row.external_id, row.id)
  }

  const toInsert: Database["public"]["Tables"]["matches"]["Insert"][] = []
  let updated = 0

  for (const m of matches) {
    const homeId = teamIdByExt.get(m.homeExternalId)
    const awayId = teamIdByExt.get(m.awayExternalId)
    if (!homeId || !awayId) {
      throw new Error(
        `Brak drużyny dla meczu ${m.externalId} (${m.homeExternalId} vs ${m.awayExternalId}).`,
      )
    }

    const fields = {
      stage: m.stage,
      group: m.group,
      kickoff_at: m.kickoffAt,
      home_team_id: homeId,
      away_team_id: awayId,
      status: "scheduled" as const,
      external_id: m.externalId,
      round_label: m.roundLabel,
    }

    const id = idByExt.get(m.externalId)
    if (id) {
      const { error: updErr } = await sb
        .from("matches")
        .update(fields)
        .eq("id", id)
      if (updErr) throw updErr
      updated++
    } else {
      toInsert.push(fields)
    }
  }

  if (toInsert.length > 0) {
    const { error: insErr } = await sb.from("matches").insert(toInsert)
    if (insErr) throw insErr
  }

  return { inserted: toInsert.length, updated }
}

// ------------------------------------
// Main
// ------------------------------------

async function main() {
  const sb = createClient<Database>(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { autoRefreshToken: false, persistSession: false } },
  )

  const { teams, matches, source } = await loadSeedData()

  const teamIdByExt = await upsertTeams(sb, teams)
  const { inserted, updated } = await upsertMatches(sb, matches, teamIdByExt)

  console.log(
    `Seed (${source}) zakończony: ${teams.length} drużyn, ` +
      `mecze — dodane: ${inserted}, zaktualizowane: ${updated}.`,
  )
}

main().catch((err) => {
  console.error("Seed nieudany:", err)
  process.exit(1)
})
