import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-4 text-center">
        <p className="text-6xl font-bold text-muted-foreground">404</p>
        <h1 className="text-2xl font-bold">Strona nie istnieje</h1>
        <p className="text-muted-foreground">
          Nie znaleziono żądanej strony. Mogła zostać przeniesiona lub usunięta.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80 transition-colors"
        >
          Wróć do strony głównej
        </Link>
      </div>
    </div>
  )
}
