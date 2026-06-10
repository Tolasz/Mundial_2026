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
      const res = await fetch("/api/admin/generate-opinions", {
        method: "POST",
      })
      const data = (await res.json()) as {
        ok?: boolean
        matchCount?: number
        opinions?: Array<{ persona: string; ok: boolean; error?: string }>
        error?: string
        detail?: string
      }

      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "Błąd generowania opinii", {
          description: data.detail,
        })
        return
      }

      const failed = (data.opinions ?? []).filter((o) => !o.ok)
      if (failed.length > 0) {
        toast.warning("Generowanie zakończone z błędami", {
          description: failed.map((o) => `${o.persona}: ${o.error}`).join("; "),
        })
      } else {
        toast.success(
          `Opinie wygenerowane dla ${data.matchCount ?? 0} mecz${
            (data.matchCount ?? 0) === 1 ? "u" : "ów"
          }`,
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
