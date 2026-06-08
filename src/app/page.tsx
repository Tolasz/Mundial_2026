import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="text-center max-w-lg">
        <h1 className="text-4xl font-bold mb-4">⚽ Mundial Typer 2026</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Typuj dokładne wyniki meczów Mistrzostw Świata 2026. Rywalizuj ze znajomymi w rankingu na żywo!
        </p>
        <p className="text-sm text-muted-foreground">
          Aplikacja w budowie — wróć wkrótce.
        </p>
      </div>
    </main>
  );
}

