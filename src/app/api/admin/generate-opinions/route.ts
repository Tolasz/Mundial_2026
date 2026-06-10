// Route Handler: POST /api/admin/generate-opinions
// Ręczne wyzwolenie generowania opinii ekspertów — tylko dla adminów.
// Używane przez przycisk w zakładce "Opinie ekspertów".

import { NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { createOddsApi } from "@/lib/odds-api"
import { createAzureOpenAIClient } from "@/lib/azure-openai"
import { generateExpertOpinions } from "@/lib/experts/generate"

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
    const oddsApi = createOddsApi()
    const aiClient = createAzureOpenAIClient()

    const result = await generateExpertOpinions(
      supabaseService,
      oddsApi,
      aiClient,
    )

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
