import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import {
  ExpertOpinionCard,
  type ExpertPickDisplay,
  type ExpertComment,
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

  // Pobierz aktywne opinie ekspertów (3 z danej rundy)
  const { data: opinions, error } = await supabase
    .from("expert_opinions")
    .select("persona, display_name, intro, picks, generated_at")
    .eq("is_active", true)
    .order("persona")

  // Pobierz komentarze do aktywnych opinii
  const activePersonas = (opinions ?? []).map(o => o.persona as string)
  const { data: allComments } = activePersonas.length > 0
    ? await supabase
        .from("expert_comments")
        .select("post_persona, commenter_persona, commenter_display_name, stance, body")
        .eq("post_type", "opinion")
        .in("post_persona", activePersonas)
    : { data: [] }

  // Grupuj komentarze po poście
  const commentsByPost = new Map<string, ExpertComment[]>()
  for (const c of allComments ?? []) {
    const key = c.post_persona as string
    if (!commentsByPost.has(key)) commentsByPost.set(key, [])
    commentsByPost.get(key)!.push({
      commenterPersona: c.commenter_persona as string,
      commenterDisplayName: c.commenter_display_name as string,
      stance: c.stance as string | null,
      body: c.body as string,
    })
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
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
    <div className="max-w-3xl mx-auto space-y-6">
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
                comments={commentsByPost.get(opinion.persona as string)}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
