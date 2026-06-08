# ⚽ Mundial Typer 2026

Aplikacja do typowania dokładnych wyników meczów Mistrzostw Świata 2026 dla znajomych.
Logowanie email/hasło, rejestracja email/hasło, live ranking, dark mode.

**Stack:** Next.js 15 · TypeScript · Tailwind CSS v4 · shadcn/ui · Supabase · Vercel

---

## Instalacja

```bash
pnpm install
cp .env.example .env.local
# Uzupełnij .env.local swoimi kluczami
```

## Uruchomienie

```bash
pnpm dev       # http://localhost:3000
pnpm build     # Build produkcyjny
pnpm start     # Uruchamia build produkcyjny
pnpm test      # Testy jednostkowe (vitest)
pnpm lint      # ESLint
```

## Seed danych

```bash
pnpm seed      # Drużyny + 72 mecze fazy grupowej (idempotentny)
```

Pobiera dane z football-data.org (`FOOTBALL_API_KEY`); gdy API jest niedostępne,
używa zaszytej listy zapasowej. Wymaga `SUPABASE_SERVICE_ROLE_KEY` w `.env.local`.

## Zmienne środowiskowe

| Zmienna | Opis |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL projektu Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Klucz publiczny (anon) Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Klucz service role (tylko server/cron) |
| `FOOTBALL_API_KEY` | Klucz API football-data.org |
| `FOOTBALL_API_PROVIDER` | Dostawca danych (domyślnie: `football-data`) |
| `CRON_SECRET` | Sekret autoryzacji endpointu cron |

## Struktura projektu

```
src/
  app/
    (auth)/login, (auth)/register   # publiczne
    (app)/predictions               # typowanie
    (app)/leaderboard               # ranking
    (app)/champion                  # typ mistrza
    (admin)/admin                   # panel admina
    api/cron/sync-results/          # endpoint cron
  components/
    ui/                             # shadcn/ui komponenty
    theme-provider.tsx
    theme-toggle.tsx
  lib/
    supabase/                       # klienty server/client
    scoring.ts                      # silnik punktacji
    football-api.ts                 # adapter danych
  types/db.ts                       # typy z Supabase
supabase/
  migrations/                       # migracje SQL
```

