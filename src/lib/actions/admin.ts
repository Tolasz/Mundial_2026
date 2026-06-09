"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { createClient, createServiceClient } from "@/lib/supabase/server"

type ActionResult = { success: true } | { success: false; error: string }

async function verifyAdmin(): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "Musisz być zalogowany." }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single()

  if (!profile?.is_admin) return { ok: false, error: "Brak uprawnień administratora." }
  return { ok: true }
}

// ── Update match result ────────────────────────────────────────────────────────

const updateMatchResultSchema = z.object({
  matchId: z.string().uuid("Nieprawidłowe ID meczu."),
  homeScore: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
    z.number().int().min(0).max(99).nullable(),
  ),
  awayScore: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
    z.number().int().min(0).max(99).nullable(),
  ),
  status: z.enum(["scheduled", "live", "finished", "postponed"]),
})

export async function adminUpdateMatchResult(input: unknown): Promise<ActionResult> {
  const auth = await verifyAdmin()
  if (!auth.ok) return { success: false, error: auth.error }

  const parsed = updateMatchResultSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Nieprawidłowe dane." }
  }

  const { matchId, homeScore, awayScore, status } = parsed.data

  const service = await createServiceClient()
  const { error } = await service
    .from("matches")
    .update({ home_score: homeScore, away_score: awayScore, status })
    .eq("id", matchId)

  if (error) return { success: false, error: "Błąd zapisu wyniku." }

  revalidatePath("/admin/matches")
  revalidatePath("/predictions")
  revalidatePath("/leaderboard")
  return { success: true }
}

// ── Recalculate match points ───────────────────────────────────────────────────

export async function adminRecalcMatchPoints(matchId: string): Promise<ActionResult> {
  if (!z.string().uuid().safeParse(matchId).success) {
    return { success: false, error: "Nieprawidłowe ID meczu." }
  }

  const auth = await verifyAdmin()
  if (!auth.ok) return { success: false, error: auth.error }

  const service = await createServiceClient()
  const { error } = await service.rpc("recalc_match_points", { p_match_id: matchId })

  if (error) return { success: false, error: "Błąd przeliczania punktów." }

  revalidatePath("/admin/matches")
  revalidatePath("/leaderboard")
  return { success: true }
}

// ── Update knockout match teams ────────────────────────────────────────────────

const updateKnockoutTeamsSchema = z.object({
  matchId: z.string().uuid("Nieprawidłowe ID meczu."),
  homeTeamId: z.string().uuid("Nieprawidłowe ID drużyny (gospodarze)."),
  awayTeamId: z.string().uuid("Nieprawidłowe ID drużyny (goście)."),
  kickoffAt: z.string().min(1, "Wymagana data meczu."),
})

export async function adminUpdateKnockoutTeams(input: unknown): Promise<ActionResult> {
  const auth = await verifyAdmin()
  if (!auth.ok) return { success: false, error: auth.error }

  const parsed = updateKnockoutTeamsSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Nieprawidłowe dane." }
  }

  const { matchId, homeTeamId, awayTeamId, kickoffAt } = parsed.data

  if (homeTeamId === awayTeamId) {
    return { success: false, error: "Drużyny muszą być różne." }
  }

  const kickoffDate = new Date(kickoffAt)
  if (isNaN(kickoffDate.getTime())) {
    return { success: false, error: "Nieprawidłowa data meczu." }
  }

  const service = await createServiceClient()
  // Extra safety: only update knockout matches
  const { error } = await service
    .from("matches")
    .update({
      home_team_id: homeTeamId,
      away_team_id: awayTeamId,
      kickoff_at: kickoffDate.toISOString(),
    })
    .eq("id", matchId)
    .neq("stage", "group")

  if (error) return { success: false, error: "Błąd zapisu pary." }

  revalidatePath("/admin")
  revalidatePath("/admin/knockout")
  revalidatePath("/predictions")
  return { success: true }
}

// ── Update settings ────────────────────────────────────────────────────────────

const updateSettingsSchema = z.object({
  tournamentStarted: z.boolean(),
  championLockedAt: z.string().nullable(),
})

export async function adminUpdateSettings(input: unknown): Promise<ActionResult> {
  const auth = await verifyAdmin()
  if (!auth.ok) return { success: false, error: auth.error }

  const parsed = updateSettingsSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Nieprawidłowe dane." }
  }

  const { tournamentStarted, championLockedAt } = parsed.data

  let lockedAt: string | null = null
  if (championLockedAt) {
    const d = new Date(championLockedAt)
    if (isNaN(d.getTime())) {
      return { success: false, error: "Nieprawidłowa data blokady mistrza." }
    }
    lockedAt = d.toISOString()
  }

  const service = await createServiceClient()
  const { error } = await service
    .from("settings")
    .update({ tournament_started: tournamentStarted, champion_locked_at: lockedAt })
    .eq("id", 1)

  if (error) return { success: false, error: "Błąd zapisu ustawień." }

  revalidatePath("/admin")
  revalidatePath("/champion")
  return { success: true }
}
