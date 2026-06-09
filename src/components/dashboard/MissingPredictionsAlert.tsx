import Link from "next/link"

interface MissingPredictionsAlertProps {
  count: number
}

export function MissingPredictionsAlert({
  count,
}: MissingPredictionsAlertProps) {
  if (count === 0) return null

  return (
    <div
      role="alert"
      className="rounded-lg border border-yellow-400/40 bg-yellow-400/10 p-4 flex items-start gap-3"
    >
      <span className="text-xl leading-none mt-0.5" aria-hidden="true">
        ⚠️
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground">
          Masz {count} {count === 1 ? "nieuzupełniony typ" : count < 5 ? "nieuzupełnione typy" : "nieuzupełnionych typów"}
        </p>
        <p className="text-sm text-muted-foreground mt-0.5">
          Uzupełnij typy przed rozpoczęciem meczu, żeby zdobyć punkty.
        </p>
      </div>
      <Link
        href="/predictions#missing"
        className="shrink-0 rounded-md bg-yellow-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-yellow-600 transition-colors"
      >
        Uzupełnij
      </Link>
    </div>
  )
}
