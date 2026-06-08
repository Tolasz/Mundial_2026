"use client"

import { useEffect } from "react"

export default function GlobalError({
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
    <html lang="pl">
      <body
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          padding: "1rem",
        }}
      >
        <div style={{ maxWidth: "32rem", textAlign: "center" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>
            Coś poszło nie tak
          </h1>
          <p style={{ marginTop: "0.5rem", color: "#888" }}>
            Wystąpił krytyczny błąd aplikacji.
          </p>
          {error.message && (
            <pre
              style={{
                marginTop: "1rem",
                overflow: "auto",
                borderRadius: "0.5rem",
                background: "rgba(239,68,68,0.1)",
                color: "#ef4444",
                padding: "0.5rem 0.75rem",
                textAlign: "left",
                fontSize: "0.875rem",
              }}
            >
              {error.message}
            </pre>
          )}
          {error.digest && (
            <p style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: "#888" }}>
              Digest: {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            style={{
              marginTop: "1rem",
              padding: "0.5rem 1rem",
              borderRadius: "0.5rem",
              border: "1px solid #888",
              cursor: "pointer",
              background: "transparent",
              color: "inherit",
            }}
          >
            Spróbuj ponownie
          </button>
        </div>
      </body>
    </html>
  )
}
