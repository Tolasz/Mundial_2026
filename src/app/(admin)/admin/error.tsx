"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="space-y-4 py-8 text-center">
      <h1 className="text-xl font-bold">Błąd panelu administracyjnego</h1>
      <p className="text-muted-foreground">
        Wystąpił błąd podczas ładowania danych administracyjnych.
      </p>
      <Button onClick={reset}>Spróbuj ponownie</Button>
    </div>
  )
}
