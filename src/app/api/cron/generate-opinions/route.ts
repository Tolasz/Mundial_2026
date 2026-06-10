// Route Handler: GET /api/cron/generate-opinions
// Generuje opinie 3 ekspertów AI dla nadchodzących meczów.
// Wywoływany przez pg_cron codziennie o 04:00 UTC (= 06:00 PL latem).
// Autoryzowany przez nagłówek "Authorization: Bearer <CRON_SECRET>".

import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { createOddsApi } from "@/lib/odds-api"
import { createAzureOpenAIClient } from "@/lib/azure-openai"
import { generateExpertOpinions } from "@/lib/experts/generate"

export const runtime = "nodejs"
// Generowanie wymaga wywołań LLM — dajemy spory zapas czasu
export const maxDuration = 120

export async function GET(request: Request) {
  // ------------------------------------
  // Autoryzacja (wzorzec z sync-results/route.ts)
  // ------------------------------------
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get("authorization")

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const supabase = await createServiceClient()
    const oddsApi = createOddsApi()
    const aiClient = createAzureOpenAIClient()

    const result = await generateExpertOpinions(supabase, oddsApi, aiClient)

    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    return NextResponse.json(
      {
        error: "Nie udało się wygenerować opinii",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    )
  }
}
