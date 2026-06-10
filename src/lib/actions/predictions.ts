"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

const savePredictionSchema = z.object({
  matchId: z.string().uuid("Nieprawidłowe ID meczu."),
  homePick: z.coerce
    .number()
    .int("Wynik musi być liczbą całkowitą.")
    .min(0, "Minimalna wartość to 0.")
    .max(99, "Maksymalna wartość to 99."),
  awayPick: z.coerce
    .number()
    .int("Wynik musi być liczbą całkowitą.")
    .min(0, "Minimalna wartość to 0.")
    .max(99, "Maksymalna wartość to 99."),
})

export type SavePredictionInput = z.infer<typeof savePredictionSchema>
export type SavePredictionResult =
  | { success: true }
  | { success: false; error: string }

export async function savePrediction(
  input: unknown,
): Promise<SavePredictionResult> {
  const parsed = savePredictionSchema.safeParse(input)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message ?? "Nieprawidłowe dane.",
    }
  }

  const { matchId, homePick, awayPick } = parsed.data

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Musisz być zalogowany." }
  }

  // Server-side lock check (defense in depth beyond RLS)
  const { data: match } = await supabase
    .from("matches")
    .select("kickoff_at")
    .eq("id", matchId)
    .single()

  if (!match) {
    return { success: false, error: "Mecz nie istnieje." }
  }

  if (new Date() >= new Date(match.kickoff_at)) {
    return { success: false, error: "Nie można typować po starcie meczu." }
  }

  const { error } = await supabase.from("predictions").upsert(
    {
      user_id: user.id,
      match_id: matchId,
      home_pick: homePick,
      away_pick: awayPick,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,match_id" },
  )

  if (error) {
    return { success: false, error: "Błąd zapisu. Spróbuj ponownie." }
  }

  revalidatePath("/")
  revalidatePath("/predictions")
  return { success: true }
}
