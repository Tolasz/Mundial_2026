"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

export function AdminRefreshOpinions() {
  const [loading, setLoading] = useState(false)

  async function handleRefresh() {
    setLoading(true)
    try {
      // Wygeneruj opinie ekspertów (nadchodzące mecze)
      const opinionsRes = await fetch("/api/admin/generate-opinions", {
        method: "POST",
      })
      const opinionsData = (await opinionsRes.json()) as {
        ok?: boolean
        matchCount?: number
        opinions?: Array<{ persona: string; ok: boolean; error?: string }>
        error?: string
        detail?: string
      }

      if (!opinionsRes.ok || !opinionsData.ok) {
        toast.error(opinionsData.error ?? "Błąd generowania opinii", {
          description: opinionsData.detail,
        })
        return
      }

      // Wygeneruj podsumowanie dnia (zakończone mecze z ostatnich 24h)
      const summaryRes = await fetch("/api/admin/generate-summary", {
        method: "POST",
      })
      const summaryData = (await summaryRes.json()) as {
        ok?: boolean
        matchCount?: number
        summaries?: Array<{ persona: string; ok: boolean; error?: string }>
        error?: string
        detail?: string
      }

      // Zbierz błędy z obu operacji
      const opinionsFailed = (opinionsData.opinions ?? []).filter((o) => !o.ok)
      const summariesFailed = (summaryData.summaries ?? []).filter((s) => !s.ok)
      const allFailed = [...opinionsFailed, ...summariesFailed]

      if (allFailed.length > 0) {
        toast.warning("Generowanie zakończone z błędami", {
          description: allFailed.map((o) => `${o.persona}: ${o.error}`).join("; "),
        })
      } else {
        const opCount = opinionsData.matchCount ?? 0
        const sumCount = summaryData.matchCount ?? 0
        toast.success(
          `Opinie (${opCount} mecz${opCount === 1 ? "" : opCount < 5 ? "e" : "ów"}) i podsumowanie dnia (${sumCount} mecz${sumCount === 1 ? "" : sumCount < 5 ? "e" : "ów"}) wygenerowane`,
        )
      }
    } catch {
      toast.error("Nie udało się połączyć z serwerem")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleRefresh}
      disabled={loading}
    >
      <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
      {loading ? "Generowanie…" : "Odśwież opinie"}
    </Button>
  )
}
