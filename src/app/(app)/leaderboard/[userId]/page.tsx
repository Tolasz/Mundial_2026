import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { buildStatsVM } from "@/lib/stats/player"
import { PlayerStats } from "@/components/player-stats"

interface PageProps {
  params: Promise<{ userId: string }>
}

export default async function PlayerHistoryPage({ params }: PageProps) {
  const { userId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Fetch player profile to validate userId and get nick
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, nick")
    .eq("id", userId)
    .single()

  if (!profile) notFound()

  // Fetch player match history from view (post-kickoff only, ordered by kickoff_at)
  const { data: historyRows } = await supabase
    .from("player_points_history")
    .select("*")
    .eq("user_id", userId)
    .order("kickoff_at", { ascending: true })

  const history = historyRows ?? []

  // Fetch summary row from leaderboard view for champion bonus and total
  const { data: lbRow } = await supabase
    .from("leaderboard")
    .select("total_points, match_points, champion_bonus")
    .eq("user_id", userId)
    .single()

  const championBonus = lbRow?.champion_bonus ?? 0
  const totalPoints = lbRow?.total_points ?? 0

  const statsVM = buildStatsVM(history, lbRow ?? null)

  const isOwnProfile = user.id === userId

  return (
    <div className="space-y-4">
      <Link
        href="/leaderboard"
        className="text-muted-foreground hover:text-foreground text-sm inline-block"
      >
        ← Ranking
      </Link>

      <div>
        <h1 className="text-2xl font-bold">
          {profile.nick}
          {isOwnProfile && (
            <span className="ml-2 text-base font-normal text-muted-foreground">
              (Ty)
            </span>
          )}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Łącznie:{" "}
          <span className="font-semibold text-foreground">{totalPoints} pkt</span>
        </p>
      </div>

      <PlayerStats vm={statsVM} />

      {history.length === 0 && championBonus === 0 && (
        <p className="text-muted-foreground py-4">
          Brak rozliczonych meczów.
        </p>
      )}

      {(history.length > 0 || championBonus > 0) && (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="border-b text-muted-foreground text-xs">
                <th className="text-left py-3 px-3">Mecz</th>
                <th className="text-right py-3 px-2 hidden sm:table-cell">
                  Typ
                </th>
                <th className="text-right py-3 px-2">Wynik</th>
                <th className="text-right py-3 px-3">Pkt</th>
                <th className="text-right py-3 px-3 hidden sm:table-cell">
                  Suma
                </th>
              </tr>
            </thead>
            <tbody>
              {history.map((row) => {
                const kickoffDate = new Date(row.kickoff_at!)
                const dateStr = kickoffDate.toLocaleDateString("pl-PL", {
                  day: "2-digit",
                  month: "2-digit",
                })
                const resultStr =
                  row.home_score !== null && row.away_score !== null
                    ? `${row.home_score}:${row.away_score}`
                    : "—"
                const pickStr = `${row.home_pick}:${row.away_pick}`
                const pointsStr =
                  row.points_awarded !== null
                    ? String(row.points_awarded)
                    : "—"
                const pointsCls =
                  row.points_awarded === 3
                    ? "text-green-500 font-bold"
                    : row.points_awarded === 1
                      ? "text-blue-400"
                      : row.points_awarded === 0
                        ? "text-muted-foreground"
                        : ""

                return (
                  <tr
                    key={row.prediction_id}
                    className="border-b last:border-0 hover:bg-muted/20"
                  >
                    <td className="py-2 px-3">
                      <div className="font-medium">
                        {row.home_team_short ?? "?"} –{" "}
                        {row.away_team_short ?? "?"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {dateStr}
                        {row.round_label ? ` · ${row.round_label}` : ""}
                      </div>
                    </td>
                    <td className="text-right py-2 px-2 tabular-nums text-muted-foreground hidden sm:table-cell">
                      {pickStr}
                    </td>
                    <td className="text-right py-2 px-2 tabular-nums font-medium">
                      {resultStr}
                    </td>
                    <td
                      className={`text-right py-2 px-3 tabular-nums ${pointsCls}`}
                    >
                      {pointsStr}
                    </td>
                    <td className="text-right py-2 px-3 tabular-nums text-muted-foreground hidden sm:table-cell">
                      {row.cumulative_points}
                    </td>
                  </tr>
                )
              })}

              {championBonus > 0 && (
                <tr className="border-b last:border-0 bg-yellow-500/10">
                  <td className="py-2 px-3 font-medium">
                    <span className="text-yellow-500">★</span> Bonus mistrza
                  </td>
                  <td className="py-2 px-2 hidden sm:table-cell" />
                  <td className="py-2 px-2" />
                  <td className="text-right py-2 px-3 tabular-nums font-bold text-yellow-500">
                    +{championBonus}
                  </td>
                  <td className="text-right py-2 px-3 tabular-nums font-bold text-yellow-500 hidden sm:table-cell">
                    {totalPoints}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
