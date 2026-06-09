"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

const saveChampionSchema = z.object({
  teamId: z.string().uuid("Nieprawidłowe ID drużyny."),
})

export type SaveChampionResult =
  | { success: true }
  | { success: false; error: string }

export async function saveChampion(
  input: unknown,
): Promise<SaveChampionResult> {
  const parsed = saveChampionSchema.safeParse(input)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message ?? "Nieprawidłowe dane.",
    }
  }

  const { teamId } = parsed.data

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Musisz być zalogowany." }
  }

  // Server-side lock check (defense in depth beyond RLS)
  const { data: settings } = await supabase
    .from("settings")
    .select("tournament_started, champion_locked_at")
    .single()

  if (!settings) {
    return { success: false, error: "Błąd konfiguracji." }
  }

  const isLocked =
    settings.tournament_started === true ||
    (settings.champion_locked_at !== null &&
      new Date() >= new Date(settings.champion_locked_at))

  if (isLocked) {
    return { success: false, error: "Typ mistrza jest już zablokowany." }
  }

  // Verify team exists
  const { data: team } = await supabase
    .from("teams")
    .select("id")
    .eq("id", teamId)
    .single()

  if (!team) {
    return { success: false, error: "Drużyna nie istnieje." }
  }

  const { error } = await supabase
    .from("profiles")
    .update({ champion_team_id: teamId })
    .eq("id", user.id)

  if (error) {
    return { success: false, error: "Błąd zapisu. Spróbuj ponownie." }
  }

  revalidatePath("/champion")
  revalidatePath("/leaderboard")
  return { success: true }
}
