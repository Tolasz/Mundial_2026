import { createClient } from "@/lib/supabase/server"
import { AdminNav } from "./AdminNav"
import { SettingsForm } from "./SettingsForm"
import { AdminRefreshOpinions } from "@/components/admin-refresh-opinions"

export default async function AdminPage() {
  const supabase = await createClient()

  const [{ data: settings }, { count: matchCount }, { count: userCount }] = await Promise.all([
    supabase.from("settings").select("*").single(),
    supabase.from("matches").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
  ])

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Panel admina</h1>
        <AdminRefreshOpinions />
      </div>
      <AdminNav />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        <div className="rounded-lg border border-border p-4">
          <p className="text-sm text-muted-foreground">Mecze</p>
          <p className="text-2xl font-bold">{matchCount ?? "–"}</p>
        </div>
        <div className="rounded-lg border border-border p-4">
          <p className="text-sm text-muted-foreground">Gracze</p>
          <p className="text-2xl font-bold">{userCount ?? "–"}</p>
        </div>
        <div className="rounded-lg border border-border p-4">
          <p className="text-sm text-muted-foreground">Status turnieju</p>
          <p className="text-sm font-semibold mt-1">
            {settings?.tournament_started ? "Rozpoczęty" : "Przed startem"}
          </p>
        </div>
      </div>

      <section>
        <h2 className="text-lg font-semibold mb-3">Ustawienia turnieju</h2>
        {settings ? (
          <SettingsForm
            tournamentStarted={settings.tournament_started}
            championLockedAt={settings.champion_locked_at}
          />
        ) : (
          <p className="text-muted-foreground text-sm">Brak danych ustawień.</p>
        )}
      </section>
    </div>
  )
}
