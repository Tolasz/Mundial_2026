import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import {
  ExpertOpinionCard,
  type ExpertPickDisplay,
} from "@/components/expert-opinion-card"
import { AdminRefreshOpinions } from "@/components/admin-refresh-opinions"

export default async function OpiniePage() {
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

  // Pobierz aktualne opinie ekspertów
  const { data: opinions, error } = await supabase
    .from("expert_opinions")
    .select("persona, display_name, intro, picks, generated_at")
    .order("persona")

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Opinie ekspertów</h1>
        <p className="text-destructive">
          Błąd ładowania opinii. Spróbuj odświeżyć stronę.
        </p>
      </div>
    )
  }

  const generatedAt =
    opinions && opinions.length > 0 ? opinions[0].generated_at : null

  return (
    <div className="space-y-6">
      {/* Nagłówek */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Opinie ekspertów</h1>
          {generatedAt && (
            <p className="text-sm text-muted-foreground mt-1">
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

      {/* Puste stany */}
      {(!opinions || opinions.length === 0) && (
        <p className="py-12 text-center text-muted-foreground">
          Opinie jeszcze nie zostały wygenerowane.
          {isAdmin && " Użyj przycisku powyżej, aby je wygenerować."}
        </p>
      )}

      {/* 3 karty ekspertów */}
      {opinions && opinions.length > 0 && (
        <div className="space-y-8">
          {opinions.map((opinion, index) => {
            const picks = (
              Array.isArray(opinion.picks) ? opinion.picks : []
            ) as unknown as ExpertPickDisplay[]

            return (
              <ExpertOpinionCard
                key={opinion.persona}
                displayName={opinion.display_name}
                intro={opinion.intro}
                picks={picks}
                colorIndex={index}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
