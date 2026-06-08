"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function Error({
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
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-4 text-center">
        <h1 className="text-2xl font-bold">Coś poszło nie tak</h1>
        <p className="text-muted-foreground">
          Wystąpił nieoczekiwany błąd podczas ładowania strony.
        </p>
        {error.message && (
          <pre className="overflow-auto rounded-lg bg-destructive/10 px-3 py-2 text-left text-sm text-destructive">
            {error.message}
          </pre>
        )}
        {error.digest && (
          <p className="text-xs text-muted-foreground">Digest: {error.digest}</p>
        )}
        <Button onClick={reset} size="lg">
          Spróbuj ponownie
        </Button>
      </div>
    </div>
  )
}
