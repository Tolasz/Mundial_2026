import { createClient } from "@/lib/supabase/server"
import { AdminNav } from "../AdminNav"

export default async function UsersPage() {
  const supabase = await createClient()

  const { data: leaderboard } = await supabase
    .from("leaderboard")
    .select("user_id, nick, total_points, exact_hits, result_hits, predicted_count")
    .order("total_points", { ascending: false })

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, is_admin")

  const adminSet = new Set(profiles?.filter((p) => p.is_admin).map((p) => p.id) ?? [])

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Użytkownicy</h1>
      <AdminNav />

      {!leaderboard || leaderboard.length === 0 ? (
        <p className="text-muted-foreground">Brak zarejestrowanych użytkowników.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="py-2 pr-4 font-medium w-8">#</th>
                <th className="py-2 pr-4 font-medium">Nick</th>
                <th className="py-2 pr-4 font-medium text-right">Punkty</th>
                <th className="py-2 pr-4 font-medium text-right">Dokładne</th>
                <th className="py-2 pr-4 font-medium text-right">Wynik</th>
                <th className="py-2 pr-4 font-medium text-right">Typy</th>
                <th className="py-2 font-medium">Admin</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((row, idx) => (
                <tr
                  key={row.user_id}
                  className="border-b border-border/50 hover:bg-muted/30"
                >
                  <td className="py-2 pr-4 text-muted-foreground">{idx + 1}</td>
                  <td className="py-2 pr-4 font-medium">
                    {row.nick ?? <span className="text-muted-foreground">–</span>}
                  </td>
                  <td className="py-2 pr-4 text-right tabular-nums">
                    {row.total_points ?? 0}
                  </td>
                  <td className="py-2 pr-4 text-right tabular-nums text-muted-foreground">
                    {row.exact_hits ?? 0}
                  </td>
                  <td className="py-2 pr-4 text-right tabular-nums text-muted-foreground">
                    {row.result_hits ?? 0}
                  </td>
                  <td className="py-2 pr-4 text-right tabular-nums text-muted-foreground">
                    {row.predicted_count ?? 0}
                  </td>
                  <td className="py-2">
                    {row.user_id && adminSet.has(row.user_id) ? (
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        Admin
                      </span>
                    ) : (
                      <span className="text-muted-foreground">–</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
