// Route Handler: GET /api/cron/sync-results
// Pobiera wyniki i terminarz meczów z API, aktualizuje bazę i przelicza punkty.
// Automatycznie tworzy rekordy meczów pucharowych (playoff) gdy API je udostępni.
// Autoryzowany przez nagłówek "Authorization: Bearer <CRON_SECRET>".

import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { FootballDataApi } from "@/lib/football-api"

export const runtime = "nodejs"

export async function GET(request: Request) {
  // ------------------------------------
  // Autoryzacja
  // ------------------------------------
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get("authorization")

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = await createServiceClient()

  let updatedCount = 0
  let recalcCount = 0
  let knockoutInserted = 0
  let knockoutUpdated = 0
  const errors: string[] = []

  // ------------------------------------
  // Pobierz terminarz + wyniki w jednym żądaniu HTTP
  // ------------------------------------
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

  // ------------------------------------
  // Aktualizuj wyniki + przelicz punkty
  // ------------------------------------
  for (const result of results) {
    try {
      // Znajdź mecz po external_id
      const { data: match, error: fetchError } = await supabase
        .from("matches")
        .select("id, status")
        .eq("external_id", result.externalId)
        .single()

      if (fetchError || !match) continue

      // Dla meczu przełożonego — zeruj wyniki
      const homeScore =
        result.status === "postponed" ? null : result.homeScore
      const awayScore =
        result.status === "postponed" ? null : result.awayScore

      const { error: updateError } = await supabase
        .from("matches")
        .update({
          status: result.status,
          home_score: homeScore,
          away_score: awayScore,
        })
        .eq("id", match.id)

      if (updateError) {
        errors.push(`Mecz ${result.externalId}: ${updateError.message}`)
        continue
      }

      updatedCount++

      // Przelicz punkty dla meczów zakończonych lub przełożonych
      // (recalc_match_points w SQL: postponed/brak wyniku => points_awarded = NULL)
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

  // ------------------------------------
  // Upsert meczów pucharowych (playoff)
  // API zwraca je z homeTeam/awayTeam = null dopóki pary nie są znane.
  // Gdy drużyny pojawią się w API i są już w bazie (po seedzie grupowym),
  // automatycznie uzupełniamy pary.
  // ------------------------------------
  try {
    const playoffFixtures = fixtures.filter((f) => f.stage !== "group")

    if (playoffFixtures.length > 0) {
      // Pobierz istniejące mecze pucharowe z bazy (po external_id)
      const extIds = playoffFixtures.map((f) => f.externalId)
      const { data: existingMatches, error: existingErr } = await supabase
        .from("matches")
        .select("id, external_id, home_team_id, away_team_id")
        .in("external_id", extIds)

      if (existingErr) throw existingErr

      const matchByExtId = new Map(
        (existingMatches ?? []).map((m) => [m.external_id, m]),
      )

      // Pobierz drużyny, których external_id API podało w parach
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
        stage: string
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
        const homeTeamId = f.homeTeam
          ? (teamIdByExtId.get(f.homeTeam.externalId) ?? null)
          : null
        const awayTeamId = f.awayTeam
          ? (teamIdByExtId.get(f.awayTeam.externalId) ?? null)
          : null

        const existing = matchByExtId.get(f.externalId)

        if (existing) {
          // Zawsze odśwież kickoff_at; uzupełnij drużyny tylko gdy były nullem
          const updates: Record<string, unknown> = { kickoff_at: f.kickoffAt }
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
