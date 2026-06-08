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

## Cron — synchronizacja wyników

Endpoint `/api/cron/sync-results` jest wywoływany automatycznie przez Vercel co 15 minut
(harmonogram w `vercel.json`). Pobiera wyniki z football-data.org, aktualizuje mecze
i przelicza punkty graczy.

### Konfiguracja CRON_SECRET w Vercel

1. W panelu Vercel przejdź do **Settings → Environment Variables**.
2. Dodaj zmienną `CRON_SECRET` z losową, trudną do odgadnięcia wartością
   (np. wygenerowaną przez `openssl rand -hex 32`).
3. Wykonaj redeploy, aby zmienna była dostępna w środowisku.

Vercel automatycznie przekazuje `Authorization: Bearer <CRON_SECRET>` do endpointu
cron. Żądania bez poprawnego sekretu otrzymują odpowiedź `401 Unauthorized`.

### Ręczne wywołanie (lokalnie / testowanie)

```bash
curl -H "Authorization: Bearer <twój_CRON_SECRET>" \
  http://localhost:3000/api/cron/sync-results
```

