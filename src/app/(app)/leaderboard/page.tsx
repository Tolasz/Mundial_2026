import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"

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

  const leaderboard = rows ?? []

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Ranking</h1>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="border-b text-muted-foreground text-xs">
              <th className="text-left py-3 px-3 w-10">#</th>
              <th className="text-left py-3 px-3">Gracz</th>
              <th className="text-right py-3 px-3">Punkty</th>
              <th
                className="text-right py-3 px-3 hidden sm:table-cell"
                title="Dokładne trafienia (3 pkt)"
              >
                3 pkt
              </th>
              <th
                className="text-right py-3 px-3 hidden sm:table-cell"
                title="Trafione rezultaty (1 pkt)"
              >
                1 pkt
              </th>
              <th className="text-right py-3 px-3 hidden md:table-cell">
                Typy
              </th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="py-8 text-center text-muted-foreground"
                >
                  Brak danych rankingowych.
                </td>
              </tr>
            )}
            {leaderboard.map((row, idx) => {
              const isCurrentUser = row.user_id === user.id
              return (
                <tr
                  key={row.user_id!}
                  className={`border-b last:border-0 hover:bg-muted/30 transition-colors ${
                    isCurrentUser ? "bg-primary/5" : ""
                  }`}
                >
                  <td className="py-3 px-3 text-muted-foreground font-medium">
                    {idx + 1}.
                  </td>
                  <td className="py-3 px-3">
                    <Link
                      href={`/leaderboard/${row.user_id}`}
                      className="hover:underline font-medium"
                    >
                      {row.nick}
                    </Link>
                    {isCurrentUser && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        (Ty)
                      </span>
                    )}
                    {(row.champion_bonus ?? 0) > 0 && (
                      <span
                        className="ml-2 text-yellow-500"
                        title="Bonus za trafionego mistrza"
                      >
                        ★
                      </span>
                    )}
                  </td>
                  <td className="text-right py-3 px-3 tabular-nums font-bold">
                    {row.total_points ?? 0}
                  </td>
                  <td className="text-right py-3 px-3 tabular-nums hidden sm:table-cell">
                    {row.exact_hits ?? 0}
                  </td>
                  <td className="text-right py-3 px-3 tabular-nums hidden sm:table-cell">
                    {row.result_hits ?? 0}
                  </td>
                  <td className="text-right py-3 px-3 tabular-nums hidden md:table-cell">
                    {row.predicted_count ?? 0}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        3 pkt = dokładny wynik · 1 pkt = trafiony rezultat (W/R/P) · ★ = bonus
        za trafionego mistrza (+50 pkt)
      </p>
    </div>
  )
}
