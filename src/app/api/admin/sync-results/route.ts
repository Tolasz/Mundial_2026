// Route Handler: POST /api/admin/sync-results
// Ręczna synchronizacja wyników meczów — tylko dla adminów.
// Wywołuje tę samą logikę co /api/cron/sync-results, ale autoryzowana przez sesję.

import { NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { FootballDataApi } from "@/lib/football-api"
import type { MatchStage } from "@/types/db"

export const runtime = "nodejs"
export const maxDuration = 60

export async function POST() {
  // ------------------------------------
  // Weryfikacja admina przez sesję użytkownika
  // ------------------------------------
  const supabaseUser = await createClient()

  const {
    data: { user },
  } = await supabaseUser.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: profile } = await supabaseUser
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single()

  if (!profile?.is_admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // ------------------------------------
  // Synchronizacja wyników (service role)
  // ------------------------------------
  const supabase = await createServiceClient()

  let updatedCount = 0
  let recalcCount = 0
  let knockoutInserted = 0
  let knockoutUpdated = 0
  const errors: string[] = []

  let fixtures
  let results
  try {
    const apiKey = process.env.FOOTBALL_API_KEY ?? ""
    const api = new FootballDataApi({ apiKey })
    ;({ fixtures, results } = await api.getFixturesAndResults())
  } catch (e) {
    return NextResponse.json(
      { error: "Nie udało się pobrać danych z API", detail: String(e) },
      { status: 502 },
    )
  }

  for (const result of results) {
    try {
      const { data: match, error: fetchError } = await supabase
        .from("matches")
        .select("id, status")
        .eq("external_id", result.externalId)
        .single()

      if (fetchError || !match) continue

      const homeScore = result.status === "postponed" ? null : result.homeScore
      const awayScore = result.status === "postponed" ? null : result.awayScore

      const { error: updateError } = await supabase
        .from("matches")
        .update({ status: result.status, home_score: homeScore, away_score: awayScore })
        .eq("id", match.id)

      if (updateError) {
        errors.push(`Mecz ${result.externalId}: ${updateError.message}`)
        continue
      }

      updatedCount++

      if (result.status === "finished" || result.status === "postponed") {
        const { error: recalcError } = await supabase.rpc("recalc_match_points", {
          p_match_id: match.id,
        })
        if (recalcError) {
          errors.push(`Recalc ${result.externalId}: ${recalcError.message}`)
        } else {
          recalcCount++
        }
      }
    } catch (e) {
      errors.push(`Mecz ${result.externalId}: ${String(e)}`)
    }
  }

  try {
    const playoffFixtures = fixtures.filter((f) => f.stage !== "group")

    if (playoffFixtures.length > 0) {
      const extIds = playoffFixtures.map((f) => f.externalId)
      const { data: existingMatches, error: existingErr } = await supabase
        .from("matches")
        .select("id, external_id, home_team_id, away_team_id")
        .in("external_id", extIds)

      if (existingErr) throw existingErr

      const matchByExtId = new Map(
        (existingMatches ?? []).map((m) => [m.external_id, m]),
      )

      const teamExtIds = new Set<string>()
      for (const f of playoffFixtures) {
        if (f.homeTeam) teamExtIds.add(f.homeTeam.externalId)
        if (f.awayTeam) teamExtIds.add(f.awayTeam.externalId)
      }

      const teamIdByExtId = new Map<string, string>()
      if (teamExtIds.size > 0) {
        const { data: teamRows } = await supabase
          .from("teams")
          .select("id, external_id")
          .in("external_id", [...teamExtIds])

        for (const t of teamRows ?? []) {
          if (t.external_id) teamIdByExtId.set(t.external_id, t.id)
        }
      }

      type MatchInsert = {
        stage: MatchStage
        group: null
        kickoff_at: string
        home_team_id: string | null
        away_team_id: string | null
        status: "scheduled"
        external_id: string
        round_label: string | null
      }
      const toInsert: MatchInsert[] = []

      for (const f of playoffFixtures) {
        const homeTeamId = f.homeTeam ? (teamIdByExtId.get(f.homeTeam.externalId) ?? null) : null
        const awayTeamId = f.awayTeam ? (teamIdByExtId.get(f.awayTeam.externalId) ?? null) : null
        const existing = matchByExtId.get(f.externalId)

        if (existing) {
          const updates: { kickoff_at: string; home_team_id?: string; away_team_id?: string } = {
            kickoff_at: f.kickoffAt,
          }
          if (!existing.home_team_id && homeTeamId) updates.home_team_id = homeTeamId
          if (!existing.away_team_id && awayTeamId) updates.away_team_id = awayTeamId

          const { error: upErr } = await supabase
            .from("matches")
            .update(updates)
            .eq("id", existing.id)

          if (upErr) errors.push(`Playoff update ${f.externalId}: ${upErr.message}`)
          else knockoutUpdated++
        } else {
          toInsert.push({
            stage: f.stage,
            group: null,
            kickoff_at: f.kickoffAt,
            home_team_id: homeTeamId,
            away_team_id: awayTeamId,
            status: "scheduled",
            external_id: f.externalId,
            round_label: f.roundLabel,
          })
        }
      }

      if (toInsert.length > 0) {
        const { error: insErr } = await supabase.from("matches").insert(toInsert)
        if (insErr) errors.push(`Playoff insert: ${insErr.message}`)
        else knockoutInserted = toInsert.length
      }
    }
  } catch (e) {
    errors.push(`Playoff sync: ${String(e)}`)
  }

  return NextResponse.json({
    ok: true,
    updated: updatedCount,
    recalculated: recalcCount,
    knockoutInserted,
    knockoutUpdated,
    ...(errors.length > 0 && { errors }),
  })
}
