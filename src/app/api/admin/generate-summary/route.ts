// Route Handler: POST /api/admin/generate-summary
// Ręczne wyzwolenie generowania podsumowań dnia — tylko dla adminów.

import { NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { createOddsApi } from "@/lib/odds-api"
import { createAzureOpenAIClient } from "@/lib/azure-openai"
import { createFootballApi } from "@/lib/football-api"
import { generateDailySummaries } from "@/lib/experts/generate-summary"

export const runtime = "nodejs"
export const maxDuration = 120

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
  // Generowanie (używamy service role do zapisu)
  // ------------------------------------
  try {
    const supabaseService = await createServiceClient()
    const footballApi = createFootballApi()
    const oddsApi = createOddsApi()
    const aiClient = createAzureOpenAIClient()

    const result = await generateDailySummaries(
      supabaseService,
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
