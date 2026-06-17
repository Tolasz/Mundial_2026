// Route Handler: GET /api/cron/generate-summary
// Generuje podsumowania dnia dla 3 person AI na podstawie zakończonych meczów.
// Wywoływany przez pg_cron codziennie o 08:00 UTC (= 10:00 PL latem).
// Autoryzowany przez nagłówek "Authorization: Bearer <CRON_SECRET>".

import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { createOddsApi } from "@/lib/odds-api"
import { createAzureOpenAIClient } from "@/lib/azure-openai"
import { createFootballApi } from "@/lib/football-api"
import { generateDailySummaries } from "@/lib/experts/generate-summary"

export const runtime = "nodejs"
// Generowanie wymaga wywołań LLM + football API — dajemy spory zapas czasu
export const maxDuration = 120

export async function GET(request: Request) {
  // ------------------------------------
  // Autoryzacja (wzorzec z generate-opinions/route.ts)
  // ------------------------------------
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get("authorization")

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const supabase = await createServiceClient()
    const footballApi = createFootballApi()
    const oddsApi = createOddsApi()
    const aiClient = createAzureOpenAIClient()

    const result = await generateDailySummaries(
      supabase,
      footballApi,
      oddsApi,
      aiClient,
    )

    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    return NextResponse.json(
      {
        error: "Nie udało się wygenerować podsumowań",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    )
  }
}
