import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { PredictionsBoard } from "@/components/predictions-board"
import {
  deriveMatchStatus,
  type MatchVM,
  type PendingKnockoutVM,
  type TeamVM,
} from "@/lib/predictions/derive"

interface TeamRow {
  id: string
  name: string
  short_name: string
  flag_url: string
}

interface MatchWithTeams {
  id: string
  group: string
  kickoff_at: string
  home_team: TeamRow
  away_team: TeamRow
}

interface KnockoutMatch {
  id: string
  stage: string
  round_label: string | null
  kickoff_at: string
  home_team: TeamRow | null
  away_team: TeamRow | null
}

interface PredictionRow {
  match_id: string
  home_pick: number
  away_pick: number
}

function toTeamVM(row: TeamRow): TeamVM {
  return {
    id: row.id,
    name: row.name,
    shortName: row.short_name,
    flagUrl: row.flag_url,
  }
}

export default async function PredictionsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const now = new Date()

  const [groupResult, knockoutResult] = await Promise.all([
    supabase
      .from("matches")
      .select(
        `id, group, kickoff_at,
         home_team:teams!matches_home_team_id_fkey(id, name, short_name, flag_url),
         away_team:teams!matches_away_team_id_fkey(id, name, short_name, flag_url)`,
      )
      .eq("stage", "group")
      .not("home_team_id", "is", null)
      .not("away_team_id", "is", null)
      .order("kickoff_at", { ascending: true }),

    supabase
      .from("matches")
      .select(
        `id, stage, round_label, kickoff_at,
         home_team:teams!matches_home_team_id_fkey(id, name, short_name, flag_url),
         away_team:teams!matches_away_team_id_fkey(id, name, short_name, flag_url)`,
      )
      .in("stage", ["r32", "r16", "qf", "sf", "final"])
      .order("kickoff_at", { ascending: true }),
  ])

  if (groupResult.error) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-4">Typy meczów</h1>
        <p className="text-destructive">
          Błąd ładowania meczów. Spróbuj odświeżyć stronę.
        </p>
      </div>
    )
  }

  const rawGroupMatches = (groupResult.data ?? []) as unknown as MatchWithTeams[]
  const rawKnockoutMatches = (knockoutResult.data ?? []) as unknown as KnockoutMatch[]

  // Separate knockout into playable (both teams known) and pending
  const knockoutPlayable = rawKnockoutMatches.filter(
    (m) => m.home_team && m.away_team,
  )
  const knockoutPending = rawKnockoutMatches.filter(
    (m) => !m.home_team || !m.away_team,
  )

  // Fetch user predictions for all typeable matches
  const allTypableIds = [
    ...rawGroupMatches.map((m) => m.id),
    ...knockoutPlayable.map((m) => m.id),
  ]

  let predictions: PredictionRow[] = []
  if (allTypableIds.length > 0) {
    const { data: predsData } = await supabase
      .from("predictions")
      .select("match_id, home_pick, away_pick")
      .eq("user_id", user.id)
      .in("match_id", allTypableIds)
    predictions = predsData ?? []
  }

  const predictionMap = new Map<
    string,
    { homePick: number; awayPick: number }
  >(
    predictions.map((p) => [
      p.match_id,
      { homePick: p.home_pick, awayPick: p.away_pick },
    ]),
  )

  // Fetch others' predictions for locked matches (RLS enforces post-kickoff)
  const allLockedIds = [
    ...rawGroupMatches
      .filter((m) => now >= new Date(m.kickoff_at))
      .map((m) => m.id),
    ...knockoutPlayable
      .filter((m) => now >= new Date(m.kickoff_at))
      .map((m) => m.id),
  ]

  type OtherPredRow = {
    match_id: string
    home_pick: number
    away_pick: number
    points_awarded: number | null
    profiles: { nick: string } | null
  }

  const otherPredsMap = new Map<
    string,
    { nick: string; homePick: number; awayPick: number; pointsAwarded: number | null }[]
  >()

  if (allLockedIds.length > 0) {
    const { data: otherPreds } = await supabase
      .from("predictions")
      .select("match_id, home_pick, away_pick, points_awarded, profiles(nick)")
      .in("match_id", allLockedIds)
      .neq("user_id", user.id)
      .order("match_id")

    for (const row of (otherPreds ?? []) as unknown as OtherPredRow[]) {
      const nick = row.profiles?.nick ?? "—"
      const entry = {
        nick,
        homePick: row.home_pick,
        awayPick: row.away_pick,
        pointsAwarded: row.points_awarded,
      }
      if (!otherPredsMap.has(row.match_id)) otherPredsMap.set(row.match_id, [])
      otherPredsMap.get(row.match_id)!.push(entry)
    }
  }

  // Map raw rows to MatchVM DTOs
  function toMatchVM(
    id: string,
    group: string | null,
    stage: string,
    roundLabel: string | null,
    kickoffAt: string,
    homeRow: TeamRow,
    awayRow: TeamRow,
  ): MatchVM {
    const isLocked = now >= new Date(kickoffAt)
    const prediction = predictionMap.get(id) ?? null
    const predictionStatus = deriveMatchStatus({ prediction, isLocked })
    return {
      id,
      group,
      stage,
      roundLabel,
      kickoffAt,
      home: toTeamVM(homeRow),
      away: toTeamVM(awayRow),
      prediction,
      isLocked,
      predictionStatus,
      otherPredictions: otherPredsMap.get(id) ?? [],
    }
  }

  const groupMatchVMs: MatchVM[] = rawGroupMatches.map((m) =>
    toMatchVM(
      m.id,
      m.group,
      "group",
      null,
      m.kickoff_at,
      m.home_team,
      m.away_team,
    ),
  )

  const knockoutMatchVMs: MatchVM[] = knockoutPlayable.map((m) =>
    toMatchVM(
      m.id,
      null,
      m.stage,
      m.round_label,
      m.kickoff_at,
      m.home_team!,
      m.away_team!,
    ),
  )

  const pendingKnockoutVMs: PendingKnockoutVM[] = knockoutPending.map((m) => ({
    id: m.id,
    stage: m.stage,
    roundLabel: m.round_label,
    kickoffAt: m.kickoff_at,
  }))

  const allMatches = [...groupMatchVMs, ...knockoutMatchVMs]
  const totalCount = allMatches.length

  // Derive sorted unique group letters for toolbar
  const availableGroups = [
    ...new Set(rawGroupMatches.map((m) => m.group).filter(Boolean)),
  ].sort() as string[]

  return (
    <PredictionsBoard
      matches={allMatches}
      pendingKnockoutMatches={pendingKnockoutVMs}
      availableGroups={availableGroups}
      totalCount={totalCount}
    />
  )
}
