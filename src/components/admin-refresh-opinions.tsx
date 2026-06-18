"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

type Step = "sync" | "snapshot" | "opinions" | "summary"

const STEP_LABELS: Record<Step, string> = {
  sync: "Synchronizacja wyników…",
  snapshot: "Zapis tabeli…",
  opinions: "Generowanie opinii…",
  summary: "Generowanie podsumowania…",
}

export function AdminRefreshOpinions() {
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<Step | null>(null)

  async function handleRefresh() {
    setLoading(true)
    try {
      // 1. Synchronizacja wyników meczów z API
      setStep("sync")
      const syncRes = await fetch("/api/admin/sync-results", { method: "POST" })
      const syncData = (await syncRes.json()) as {
        ok?: boolean
        updated?: number
        recalculated?: number
        errors?: string[]
        error?: string
        detail?: string
      }

      if (!syncRes.ok || !syncData.ok) {
        toast.error(syncData.error ?? "Błąd synchronizacji wyników", {
          description: syncData.detail,
        })
        return
      }

      // 2. Snapshot tabeli liderów (zapisuje aktualną pozycję po przeliczeniu punktów)
      setStep("snapshot")
      await fetch("/api/admin/snapshot", { method: "POST" })
      // Snapshot jest opcjonalny — błąd nie blokuje dalszych kroków

      // 3. Generowanie opinii ekspertów (nadchodzące mecze)
      setStep("opinions")
      const opinionsRes = await fetch("/api/admin/generate-opinions", { method: "POST" })
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

      // 4. Generowanie podsumowania dnia (zakończone mecze z ostatnich 24h)
      setStep("summary")
      const summaryRes = await fetch("/api/admin/generate-summary", { method: "POST" })
      const summaryData = (await summaryRes.json()) as {
        ok?: boolean
        matchCount?: number
        summaries?: Array<{ persona: string; ok: boolean; error?: string }>
        error?: string
        detail?: string
      }

      // Zbierz błędy
      const opinionsFailed = (opinionsData.opinions ?? []).filter((o) => !o.ok)
      const summariesFailed = (summaryData.summaries ?? []).filter((s) => !s.ok)
      const allFailed = [...opinionsFailed, ...summariesFailed]
      const syncErrors = syncData.errors ?? []

      if (syncErrors.length > 0) {
        toast.warning(`Sync z ${syncErrors.length} błędem${syncErrors.length > 1 ? "i" : ""}`, {
          description: syncErrors.slice(0, 3).join("; "),
        })
      }

      if (allFailed.length > 0) {
        toast.warning("Generowanie zakończone z błędami", {
          description: allFailed.map((o) => `${o.persona}: ${o.error}`).join("; "),
        })
      } else {
        const opCount = opinionsData.matchCount ?? 0
        const sumCount = summaryData.matchCount ?? 0
        toast.success(
          `Gotowe — ${syncData.updated ?? 0} meczów, tabela zapisana, opinie (${opCount}) i podsumowanie (${sumCount}) wygenerowane`,
        )
      }
    } catch {
      toast.error("Nie udało się połączyć z serwerem")
    } finally {
      setLoading(false)
      setStep(null)
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
      {loading && step ? STEP_LABELS[step] : "Odśwież dane"}
    </Button>
  )
}
