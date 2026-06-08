# Plan: Strona do typowania wyników Mundialu 2026 (AGENT-READY)

> Plan rozpisany na niezależne tickety pod kodowanie agentami. Każdy ticket ma:
> **Cel · Zależności · Pliki · Kryteria akceptacji**. Agenty wykonują tickety wg kolejności
> zależności. Sekcja **KONWENCJE** to wspólny kontrakt — KAŻDY agent czyta ją przed startem.

## Cel projektu

Web app do typowania **dokładnych wyników** meczów MŚ 2026 dla ~17 znajomych. Logowanie email+hasło,
zamknięta rejestracja (kod zaproszenia), live ranking, blokada typów po starcie meczu, PL + dark mode.
Darmowy hosting: **Next.js + Supabase + Vercel**.

---

## Decyzje (potwierdzone)

| Obszar | Decyzja |
| --- | --- |
| Typ typowania | Dokładny wynik (np. 2:1) |
| Punktacja | **3 pkt** za dokładny wynik, **1 pkt** za trafiony rezultat (W/R/P), 0 inaczej |
| Bonus mistrza | **50 pkt** jeśli trafiony typ mistrza turnieju (jeden typ, na start) |
| Zakres | Faza grupowa (72 mecze) + pucharowa (R32 → finał) |
| Mecze pucharowe | Liczymy wynik **po 90 min** (dogrywka/karne ignorowane) |
| Odblokowanie pucharu | Typy dostępne po wylosowaniu par (gdy znane obie drużyny) |
| Mecz przełożony/nierozegrany | Typy zwracane **bez punktów** (`points = null`) |
| Logowanie | Email + hasło (Supabase Auth) |
| Rejestracja | **Zamknięta** — kod zaproszenia |
| Źródło danych | **football-data.org** (free tier, World Cup) + panel admina jako backup |
| Stack | Next.js (App Router) + Supabase (Postgres+Auth+RLS) + Vercel (Cron) |
| Język / UI | Polski, panel admina, dark mode, responsywność mobilna |
| Społeczność | Live ranking, blokada po starcie, podgląd cudzych typów po kickoffie |

---

## KONWENCJE (czyta każdy agent przed startem)

### Stack / wersje
- **Next.js 15** (App Router, TypeScript, React Server Components), Node 20
- **Tailwind CSS v4** + **shadcn/ui** (theme: dark domyślnie, toggle)
- **Supabase**: Postgres + Auth (email/hasło) + RLS; `@supabase/ssr` do integracji z Next
- **Vercel**: hosting + Cron Jobs (`vercel.json`)
- Walidacja: **zod**. Formularze: **react-hook-form**. Testy: **vitest** (+ Testing Library)
- Stan serwera: **Server Actions** + `revalidatePath`; minimum client state
- Menedżer pakietów: **pnpm**

### Struktura katalogów (docelowa)
```
src/
  app/
    (auth)/login, (auth)/register        # publiczne
    (app)/predictions                    # typowanie (grupa + puchar)
    (app)/leaderboard                    # ranking
    (app)/champion                       # typ mistrza
    (admin)/admin                        # panel admina (guard: is_admin)
    api/cron/sync-results/route.ts       # endpoint cron
  lib/
    supabase/{server,client,middleware}.ts
    scoring.ts                           # czysta funkcja punktacji (testowalna)
    football-api.ts                      # adapter źródła danych (interfejs + impl)
  types/db.ts                            # typy generowane z Supabase
supabase/
  migrations/*.sql
  seed.sql  (lub scripts/seed.ts)
```

### Zasady wspólne
- Autoryzacja egzekwowana przez **RLS w bazie ORAZ guardy w UI** (defense in depth).
- Lock typu = `now() >= matches.kickoff_at`; sprawdzane w RLS (policy) i w Server Action.
- Nigdy nie ufać client-side; **punkty liczone wyłącznie server-side**.
- Sekrety tylko w env: `SUPABASE_SERVICE_ROLE_KEY`, `FOOTBALL_API_KEY`, `CRON_SECRET`.
- Commit po każdym tickecie; message = ID ticketu + opis.

### Zmienne środowiskowe (`.env.local` + Vercel)
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (tylko server/cron)
- `FOOTBALL_API_KEY`, `FOOTBALL_API_PROVIDER=football-data`
- `CRON_SECRET` (autoryzacja endpointu cron)

---

## Model danych (źródło prawdy dla migracji)

- **profiles**: `id` (uuid, FK `auth.users`), `nick` (text unique), `is_admin` (bool default false),
  `champion_team_id` (uuid null FK teams), `created_at`
- **teams**: `id` (uuid), `name`, `short_name`, `flag_url`, `group` (char A–L, null dla pucharu), `external_id`
- **matches**: `id` (uuid), `stage` (enum: `group|r32|r16|qf|sf|final`), `group` (char null),
  `home_team_id` (null do losowania), `away_team_id` (null), `kickoff_at` (timestamptz),
  `home_score` (int null), `away_score` (int null), `status` (enum: `scheduled|live|finished|postponed`),
  `external_id`, `round_label`
- **predictions**: `id`, `user_id` (FK), `match_id` (FK), `home_pick` (int), `away_pick` (int),
  `points_awarded` (int null), `created_at`, `updated_at`. **UNIQUE(user_id, match_id)**
- **invite_codes**: `code` (text PK), `used_by` (uuid null), `used_at` (timestamptz null), `created_at`
- **settings** (singleton): `championship_bonus_points` (int default **50**),
  `tournament_started` (bool), `champion_locked_at` (timestamptz null)
- **Funkcje/widoki**: `leaderboard` (suma punktów + bonus per user), `recalc_match_points(match_id)`

### RLS (zarys polityk)
- **profiles**: select all (ranking/nicki); update tylko własny wiersz; `is_admin` nieedytowalne przez usera.
- **predictions**: insert/update tylko gdy `auth.uid()=user_id AND now() < match.kickoff_at`;
  select własnych zawsze; select cudzych tylko gdy `now() >= match.kickoff_at`.
- **matches/teams**: select all; modyfikacja tylko `service_role`/admin.
- **invite_codes**: brak dostępu z `anon`; obsługa przez Server Action z `service_role`.
- **admin**: polityki oparte o `profiles.is_admin`.

---

## TICKETY (kolejność wg zależności)

### T0 — Scaffold repo + tooling  ·  dep: —
- **Cel:** Działający szkielet Next.js gotowy do deployu.
- **Pliki:** root (package.json, tsconfig, tailwind, next.config, `.env.example`, README,
  `src/app/layout.tsx`, theme provider, vitest.config).
- **Akceptacja:** `pnpm dev` startuje; pusta strona z dark mode toggle; `pnpm test` przechodzi;
  deploy placeholder na Vercel zielony.

### T1 — Supabase: schema + migracje  ·  dep: T0
- **Cel:** Wszystkie tabele/enumy/funkcje z modelu danych jako migracje SQL.
- **Pliki:** `supabase/migrations/0001_init.sql`, `src/types/db.ts` (generated), `src/lib/supabase/*.ts`.
- **Akceptacja:** migracja przechodzi na czystej bazie; typy się generują; klienci server/client działają.

### T2 — RLS policies  ·  dep: T1
- **Cel:** Polityki bezpieczeństwa zgodne z sekcją RLS.
- **Pliki:** `supabase/migrations/0002_rls.sql`.
- **Akceptacja:** user nie odczyta cudzego typu przed kickoffem, nie zapisze typu po kickoffie,
  nie podniesie sobie `is_admin`.

### T3 — Auth + rejestracja na kod  ·  dep: T1, T2
- **Cel:** Logowanie email/hasło, rejestracja walidująca `invite_code` i tworząca profil z nickiem.
- **Pliki:** `src/app/(auth)/login`, `src/app/(auth)/register`, Server Actions auth, `middleware.ts`.
- **Akceptacja:** zły kod → odrzucenie; poprawny → konto + profil; kod oznaczony `used`;
  chronione trasy przekierowują niezalogowanych.

### T4 — App shell + nawigacja + theme  ·  dep: T0, T3
- **Cel:** Layout aplikacji (nav: Typy / Ranking / Mistrz / Admin*), responsywny, dark mode.
- **Pliki:** `src/app/(app)/layout.tsx`, komponenty nav/header, guard admin link.
- **Akceptacja:** nawigacja działa na mobile i desktop; link Admin tylko dla `is_admin`.

### T5 — Adapter danych + seed  ·  dep: T1  *(parallel z T3/T4)*
- **Cel:** Interfejs `FootballApi` (getFixtures/getResults) + impl **football-data.org** + seed drużyn i 72 meczów grupowych.
- **Pliki:** `src/lib/football-api.ts`, `scripts/seed.ts` lub `supabase/seed.sql`.
- **Akceptacja:** seed wypełnia teams + 12 grup + 72 mecze z `kickoff_at`; adapter pobiera wyniki (mock w testach).

### T6 — Typowanie fazy grupowej  ·  dep: T4, T5
- **Cel:** Widok meczów A–L, formularz wyniku (home/away), zapis przez Server Action, pasek postępu.
- **Pliki:** `src/app/(app)/predictions`, komponent `MatchPredictionCard`, action `savePrediction` (zod).
- **Akceptacja:** zapis/edycja typu przed kickoffem; walidacja 0–99; pasek „X/72”; brak edycji po kickoffie (UI+server).

### T7 — Silnik punktacji (czysta funkcja + testy)  ·  dep: T1  *(parallel z T6)*
- **Cel:** `scorePrediction(pred, result) -> { points }` wg reguł 3/1/0 (po 90 min dla pucharu).
- **Pliki:** `src/lib/scoring.ts`, `src/lib/scoring.test.ts`.
- **Akceptacja:** testy: `2:1 vs 2:1=3`; `2:1 vs 3:0=1`; `2:1 vs 0:2=0`; `0:0 vs 0:0=3`; mecz `postponed`/brak wyniku → `null`.

### T8 — Cron sync wyników + przeliczenie  ·  dep: T5, T7
- **Cel:** Endpoint cron pobiera wyniki, aktualizuje `matches`, woła `recalc_match_points` (service_role).
- **Pliki:** `src/app/api/cron/sync-results/route.ts`, `vercel.json` (schedule), `recalc_match_points`.
- **Akceptacja:** po zakończeniu meczu `status=finished`, wynik zapisany, `points_awarded` wyliczone;
  endpoint chroniony `CRON_SECRET`.

### T9 — Leaderboard + tabela wyników graczy + historia punktów  ·  dep: T7, T8
- **Cel:** Zakładka z rankingiem live oraz tabelą wyników wszystkich graczy; dla każdego gracza
  podgląd **historii punktów** (rozbicie per mecz + narastająco w czasie).
- **Zakres:**
  * Tabela graczy: pozycja, nick, suma punktów (mecze + bonus mistrza), liczba dokładnych trafień,
    liczba trafionych rezultatów, liczba wytypowanych meczów.
  * Historia gracza (`leaderboard/[userId]`): lista meczów z typem gracza, wynikiem końcowym i
    punktami za mecz, oraz suma narastająco (timeline). Bonus mistrza jako osobna pozycja.
  * Sortowanie rankingu malejąco; remisy rozstrzygane np. liczbą dokładnych trafień.
- **Pliki:** `src/app/(app)/leaderboard/page.tsx`, `src/app/(app)/leaderboard/[userId]/page.tsx`,
  funkcja/widok `leaderboard` + widok `player_points_history` (predictions ⋈ matches, tylko mecze
  po kickoffie / rozliczone).
- **Akceptacja:** ranking sumuje punkty poprawnie i aktualizuje się po syncu (T8); tabela graczy
  pokazuje statystyki; wejście w gracza pokazuje per-mecz punkty i sumę narastająco; działa na mobile.

### T10 — Reveal cudzych typów po kickoffie  ·  dep: T2, T6
- **Cel:** Po starcie meczu pokazać typy wszystkich graczy dla danego meczu.
- **Pliki:** rozszerzenie widoku meczu / komponent `OthersPredictions`.
- **Akceptacja:** przed kickoffem ukryte (RLS), po — widoczne.

### T11 — Typ mistrza + bonus 50 pkt  ·  dep: T3, T7
- **Cel:** Wybór mistrza turnieju przed startem (`settings.champion_locked_at`); bonus po finale.
- **Pliki:** `src/app/(app)/champion`, action `saveChampion`, logika bonusu w `recalc`/`leaderboard`.
- **Akceptacja:** zmiana mistrza zablokowana po starcie turnieju; **+50 pkt** naliczone gdy mistrz trafiony.

### T12 — Faza pucharowa  ·  dep: T6, T8
- **Cel:** Mecze pucharowe (r32→final) odblokowywane po ustaleniu par (`home/away != null`).
- **Pliki:** rozszerzenie `predictions` o sekcje pucharowe, admin/seed do uzupełniania par.
- **Akceptacja:** typ pucharowy możliwy dopiero gdy znane obie drużyny; punktacja po 90 min.

### T13 — Panel admina  ·  dep: T2, T8
- **Cel:** Ręczna korekta wyników + trigger przeliczenia; generowanie kodów; ustawianie par pucharowych; podgląd userów.
- **Pliki:** `src/app/(admin)/admin/*`, actions z `service_role`, guard `is_admin`.
- **Akceptacja:** admin nadpisuje wynik → punkty przeliczone; generuje działający kod zaproszenia.

### T14 — Polish + obsługa błędów + deploy  ·  dep: wszystkie
- **Cel:** Puste stany, błędy API, loading, responsywność, finalny dark mode, produkcyjny deploy.
- **Pliki:** globalne (`error.tsx`, `loading.tsx`, `not-found.tsx`), drobne UI.
- **Akceptacja:** brak crashy przy błędzie API; e2e ścieżka (rejestracja→typ→sync→ranking) działa na prod.

---

## Kolejność / równoległość
- **Ścieżka krytyczna:** T0 → T1 → T2 → T3 → T4 → T6 → T9/T10 → T12 → T13 → T14
- **Równolegle:** T5 (po T1) z T3/T4; T7 (po T1) z T6; T11 po T7/T3; T8 po T5+T7

## Weryfikacja (globalna)
1. Rejestracja tylko z poprawnym kodem; zły odrzucony (T3)
2. Brak edycji typu po kickoffie — test API + UI (T6)
3. Cudze typy ukryte przed kickoffem, widoczne po (T10)
4. Testy jednostkowe punktacji 3/1/0 (T7)
5. Cron pobiera wynik i aktualizuje ranking (T8/T9)
6. Admin nadpisuje wynik → przeliczenie (T13)
7. Bonus mistrza (50 pkt) naliczony po finale (T11)
8. Publiczny deploy działa na mobile (T14)

## Poza zakresem (na teraz)
- Mini-ligi/grupy, powiadomienia email, typowanie strzelców, mnożniki pucharowe,
  typowanie całej drabinki z góry, logowanie społecznościowe.
