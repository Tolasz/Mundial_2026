import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ChampionPicker } from "./ChampionPicker"

export default async function ChampionPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const [teamsResult, profileResult, settingsResult, finalResult] =
    await Promise.all([
      supabase
        .from("teams")
        .select("id, name, short_name, flag_url, group")
        .order("group", { nullsFirst: false })
        .order("name"),
      supabase
        .from("profiles")
        .select("champion_team_id")
        .eq("id", user.id)
        .single(),
      supabase
        .from("settings")
        .select("tournament_started, champion_locked_at, championship_bonus_points")
        .single(),
      supabase
        .from("matches")
        .select(
          "status, home_score, away_score, home_team_id, away_team_id",
        )
        .eq("stage", "final")
        .maybeSingle(),
    ])

  const teams = teamsResult.data ?? []
  const profile = profileResult.data
  const settings = settingsResult.data

  const isLocked =
    settings?.tournament_started === true ||
    (settings?.champion_locked_at != null &&
      new Date() >= new Date(settings.champion_locked_at))

  const final = finalResult.data
  const finalFinished = final?.status === "finished"

  return (
    <ChampionPicker
      teams={teams}
      currentChampionId={profile?.champion_team_id ?? null}
      isLocked={isLocked}
      bonusPoints={settings?.championship_bonus_points ?? 50}
      final={
        final
          ? {
              homeScore: final.home_score,
              awayScore: final.away_score,
              homeTeamId: final.home_team_id,
              awayTeamId: final.away_team_id,
            }
          : null
      }
      finalFinished={finalFinished}
    />
  )
}
