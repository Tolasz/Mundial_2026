import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DailySummaryCard } from "@/components/daily-summary-card"
import { AdminRefreshOpinions } from "@/components/admin-refresh-opinions"

export default async function PodsumowaniePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Sprawdź czy admin (na potrzeby przycisku odświeżania)
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single()

  const isAdmin = profile?.is_admin ?? false

  // Pobierz aktualne podsumowania
  const { data: summaries, error } = await supabase
    .from("daily_summaries")
    .select("persona, display_name, summary, matches_covered, generated_at")
    .order("persona")

  if (error) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <h1 className="text-2xl font-bold">Podsumowanie dnia</h1>
        <p className="text-destructive">
          Błąd ładowania podsumowań. Spróbuj odświeżyć stronę.
        </p>
      </div>
    )
  }

  const generatedAt =
    summaries && summaries.length > 0 ? summaries[0].generated_at : null

  const matchesCovered = summaries && summaries.length > 0
    ? (summaries[0].matches_covered as Array<{ homeTeamName: string; awayTeamName: string; homeScore: number | null; awayScore: number | null }> | null)
    : null

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Nagłówek */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Podsumowanie dnia</h1>
          <p className="text-sm text-muted-foreground mt-1">
            3 ekspertów AI podsumowuje mecze z ostatnich 24h
          </p>
          {generatedAt && (
            <p className="text-sm text-muted-foreground">
              Ostatnia aktualizacja:{" "}
              {new Date(generatedAt).toLocaleString("pl-PL", {
                timeZone: "Europe/Warsaw",
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          )}
        </div>
        {isAdmin && <AdminRefreshOpinions />}
      </div>

      {/* Mecze objęte podsumowaniem */}
      {matchesCovered && matchesCovered.length > 0 && (
        <div className="rounded-md border border-border bg-muted/30 p-4">
          <p className="text-sm font-medium text-muted-foreground mb-2">
            Mecze w podsumowaniu:
          </p>
          <div className="flex flex-wrap gap-2">
            {matchesCovered.map((m, i) => (
              <span
                key={i}
                className="text-sm rounded-md bg-background border border-border px-2 py-1"
              >
                {m.homeTeamName} {m.homeScore ?? "?"}–{m.awayScore ?? "?"} {m.awayTeamName}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Puste stany */}
      {(!summaries || summaries.length === 0) && (
        <p className="py-12 text-center text-muted-foreground">
          Podsumowanie nie zostało jeszcze wygenerowane.{" "}
          {isAdmin
            ? "Użyj przycisku powyżej, aby je wygenerować."
            : "Podsumowanie pojawi się jutro rano po zakończeniu meczów."}
        </p>
      )}

      {/* 3 karty podsumowań */}
      {summaries && summaries.length > 0 && (
        <div className="space-y-8">
          {summaries.map((s, index) => (
            <DailySummaryCard
              key={s.persona as string}
              displayName={s.display_name as string}
              summary={s.summary as string}
              generatedAt={s.generated_at as string}
              colorIndex={index}
            />
          ))}
        </div>
      )}
    </div>
  )
}
