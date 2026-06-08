// Route Handler: GET /api/cron/sync-results
// Pobiera wyniki meczów z API, aktualizuje bazę i przelicza punkty.
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
  const errors: string[] = []

  // ------------------------------------
  // Pobierz wyniki z zewnętrznego API
  // ------------------------------------
  let results
  try {
    const apiKey = process.env.FOOTBALL_API_KEY ?? ""
    const api = new FootballDataApi({ apiKey })
    results = await api.getResults()
  } catch (e) {
    return NextResponse.json(
      { error: "Nie udało się pobrać wyników z API", detail: String(e) },
      { status: 502 },
    )
  }

  // ------------------------------------
  // Aktualizuj mecze + przelicz punkty
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
        errors.push(
          `Mecz ${result.externalId}: ${updateError.message}`,
        )
        continue
      }

      updatedCount++

      // Przelicz punkty dla meczów zakończonych lub przełożonych
      // (recalc_match_points w SQL: postponed/brak wyniku => points_awarded = NULL)
      if (
        result.status === "finished" ||
        result.status === "postponed"
      ) {
        const { error: recalcError } = await supabase.rpc(
          "recalc_match_points",
          { p_match_id: match.id },
        )

        if (recalcError) {
          errors.push(
            `Recalc ${result.externalId}: ${recalcError.message}`,
          )
        } else {
          recalcCount++
        }
      }
    } catch (e) {
      errors.push(`Mecz ${result.externalId}: ${String(e)}`)
    }
  }

  return NextResponse.json({
    ok: true,
    updated: updatedCount,
    recalculated: recalcCount,
    ...(errors.length > 0 && { errors }),
  })
}
