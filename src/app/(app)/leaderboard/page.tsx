import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { rankRows } from "@/lib/leaderboard/derive"
import { LeaderboardPodium } from "@/components/leaderboard-podium"
import { LeaderboardTable } from "@/components/leaderboard-table"

export default async function LeaderboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: rows, error } = await supabase
    .from("leaderboard")
    .select(
      "user_id, nick, total_points, match_points, champion_bonus, exact_hits, result_hits, predicted_count",
    )
    .order("total_points", { ascending: false })
    .order("exact_hits", { ascending: false })

  if (error) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-4">Ranking</h1>
        <p className="text-destructive">
          Błąd ładowania rankingu. Spróbuj odświeżyć stronę.
        </p>
      </div>
    )
  }

  const { podium, rest } = rankRows(rows ?? [], user.id)

  const hasPodium = podium.length > 0

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Ranking</h1>

      {!hasPodium && (
        <p className="py-8 text-center text-muted-foreground">
          Brak danych rankingowych.
        </p>
      )}

      {hasPodium && (
        <>
          <LeaderboardPodium podium={podium} />
          {rest.length > 0 && <LeaderboardTable rows={rest} />}
        </>
      )}

      {hasPodium && (
        <p className="text-xs text-muted-foreground">
          3 pkt = dokładny wynik · 1 pkt = trafiony rezultat (W/R/P) · ★ = bonus za trafionego mistrza (+20 pkt)
        </p>
      )}
    </div>
  )
}


