# PLAN v2 — Redesign frontendu „Mundial 2026 Typer"

> Druga iteracja: pełny redesign systemu wizualnego (kierunek **nowoczesny sportowy /
> mundialowy**) + 10 nowych ficzerów. Backend, schemat DB, RLS i logika punktacji
> **pozostają bez zmian** — pracujemy wyłącznie na warstwie prezentacji (RSC + klient).

---

## 1. Cel i zakres

### W zakresie
- Nowa paleta i tokeny designu (murawa + akcent), spójne light/dark.
- Nowe prymitywy UI (`card`, `input`, `badge`, `tabs`, `skeleton`) obok istniejącego `button`.
- Filtrowanie/sortowanie/wyszukiwanie meczów (klienckie, natychmiastowe).
- Autosave typów (debounce) + toasty (Sonner).
- Redesign rankingu (podium top 3), dashboard powitalny, statystyki gracza.
- Spójne skeletony i stany pustych list.

### Poza zakresem (NIE ruszać)
- Schemat bazy i migracje (`supabase/migrations/*`).
- Polityki RLS (`0002_rls.sql`) i logika scoringu (`recalc_match_points`, widok `leaderboard`).
- Server Actions zapisu — sygnatury `savePrediction` / `saveChampion` zostają bez zmian.
- Panel admina — tylko ewentualny skeleton/polish, bez zmian logiki.

---

## 2. Stack (potwierdzony, niezmienny)
- Next.js 15 App Router (RSC) + TypeScript, React 19.
- Tailwind v4 + tokeny shadcn (oklch). `tw-animate-css` dostępny.
- Prymitywy: **@base-ui/react** (Base UI), `class-variance-authority`, `tailwind-merge`, `clsx`.
- `lucide-react`, `next-themes`, `react-hook-form` + `zod`.
- **Nowa zależność:** `sonner` (toasty).
- Testy: **vitest** + `@testing-library/react` + `jsdom`. Menedżer: **pnpm**.
- UI po polsku. Dark mode wspierany. Responsywność mobilna (priorytet mobile-first).

---

## 3. Decyzje architektoniczne

1. **Filtry/sort/search są klienckie.** RSC pobiera dane jak dotąd (jeden raz, `Promise.all`)
   i przekazuje je jako serializowalne propsy do klienckiego komponentu sterującego.
   Brak przeładowań i round-tripów przy filtrowaniu.
2. **Granica RSC/klient.** Strony `page.tsx` pozostają Server Components (autoryzacja,
   pobranie danych). Cała interaktywność trafia do `"use client"` komponentów-prezenterów.
   Do prezentera przekazujemy **gotowe, znormalizowane DTO** (nie surowe wiersze Supabase).
3. **Autosave zamiast przycisku „Zapisz".** Po zmianie inputu wynik zapisuje się
   automatycznie z debounce (~600 ms). Feedback przez toast. Walidacja kliencka przed
   wysyłką; serwer pozostaje źródłem prawdy (lock + zod w istniejącym Server Action).
4. **Toasty globalne.** `<Toaster>` montowany raz w root `layout.tsx`. Komponenty
   wywołują `toast.success` / `toast.error`.
5. **Design tokens, nie hardkody.** Kolory wyłącznie przez zmienne CSS / klasy tokenów
   (`bg-primary`, `text-muted-foreground`, itp.). Żadnych surowych hexów w komponentach.
6. **Brak zmian kontraktu danych.** Komponenty konsumują te same kształty co dziś;
   nowe pola wyłącznie wyliczane na kliencie z już pobranych danych.

---

## 4. Model danych (istniejący — tylko do odczytu z perspektywy v2)

- `matches(id, stage, group, home_team_id, away_team_id, kickoff_at, home_score,
  away_score, status, round_label)` — `stage ∈ {group,r32,r16,qf,sf,final}`.
- `teams(id, name, short_name, flag_url, group)`.
- `predictions(user_id, match_id, home_pick, away_pick, points_awarded)` — unikat (user,match).
- `profiles(id, nick, is_admin, champion_team_id)`.
- `settings(tournament_started, champion_locked_at, championship_bonus_points)`.
- Widoki: `leaderboard(...)`, `player_points_history(...)`.

Zasady gry (stałe): 3 pkt = dokładny wynik · 1 pkt = trafiony rezultat (W/R/P) · 0 pkt inaczej.
Bonus mistrza = `championship_bonus_points`. Lock typu gdy `now() >= kickoff_at`.
Cudze typy widoczne dopiero po kickoffie (egzekwowane RLS).

---

## 5. Architektura komponentów (docelowa)

```
src/
  app/
    layout.tsx                      # + <Toaster /> (Sonner)
    page.tsx                        # → render Dashboard (zamiast redirect)
    globals.css                     # nowa paleta/tokeny
    (app)/
      predictions/page.tsx          # RSC: fetch → <PredictionsBoard data=… />
      leaderboard/page.tsx          # RSC: fetch → <Podium /> + <LeaderboardTable />
      leaderboard/[userId]/page.tsx # RSC: fetch → <PlayerStats /> + historia
      champion/…                    # polish (skeleton, karty)
  components/
    ui/                             # prymitywy: button(✓), card, input, badge, tabs, skeleton
    team-flag.tsx                   # next/image + fallback (zastępuje inline <img>)
    predictions-board.tsx           # "use client" — filtry/sort/search/sekcje
    predictions-toolbar.tsx         # "use client" — kontrolki filtrów
    match-prediction-card.tsx       # "use client" — autosave + toast
    leaderboard-podium.tsx          # top 3
    dashboard/*                     # sekcje strony głównej
    player-stats.tsx                # statystyki gracza
  lib/
    predictions/derive.ts           # czyste funkcje: normalizacja, filtrowanie, sort, statusy
    stats/player.ts                 # czyste funkcje: skuteczność, agregaty (testowalne)
```

**Zasada kluczowa do testów:** całą logikę filtrowania/sortowania/statystyk wydzielamy do
**czystych funkcji** w `src/lib/**` (bez React/Supabase), żeby pokryć je unit-testami vitest
bez renderowania. Komponenty tylko składają UI i wołają te funkcje.

---

## 6. System wizualny

- **Paleta:** baza neutralna + `primary` w odcieniu murawy (zieleń), akcent kontrastowy
  (np. ciepły żółty/złoty dla wyróżnień, podium, bonusu mistrza). Definiowana w `:root`
  i `.dark` w `globals.css` jako zmienne `oklch`.
- **Status kolory (semantyczne):** 3 pkt = zielony, 1 pkt = niebieski/żółty, 0 = muted,
  lock = muted + ikona. Zdefiniować jako pomocnicze tokeny/util, nie powtarzać warunków.
- **Typografia:** istniejące `--font-sans` (Geist). Nagłówki większe, czytelna hierarchia.
- **Spacing/rounded:** korzystać z istniejącej skali `--radius`. Karty z subtelnym cieniem/borderem.
- **Ruch:** lekkie animacje wejścia (tw-animate-css), bez przesady. Respektować
  `prefers-reduced-motion`.

---

## 7. Fazy (tickety v2)

| Plik | Faza | Zależności |
| --- | --- | --- |
| `V1-foundation.md` | Tokeny, paleta, prymitywy UI, TeamFlag, Sonner | — |
| `V2-predictions-board.md` | Filtry/sort/search + autosave + toasty | V1 |
| `V3-leaderboard.md` | Podium top 3 + ulepszona tabela | V1 |
| `V4-dashboard.md` | Strona główna / dashboard powitalny | V1 |
| `V5-player-stats.md` | Statystyki gracza na profilu | V1 |
| `V6-polish.md` | Skeletony, empty states, champion polish, a11y | V1–V5 |

Ścieżka: **V1 → (V2 ∥ V3 ∥ V4 ∥ V5) → V6**. V2–V5 są niezależne po ukończeniu V1.

---

## 8. Ficzery (mapowanie na fazy)

1. Sortowanie meczów po dacie — V2
2. Filtrowanie po grupach — V2
3. Filtr „tylko nietypowane" / status typu — V2
4. Wyszukiwarka drużyny — V2
5. Zapis wielu typów / autosave — V2
6. Podium top 3 + ulepszony ranking — V3
7. Dashboard / najbliższe mecze / przypomnienie o brakach — V4
8. Strona główna witająca gracza — V4
9. Statystyki gracza / profil — V5
10. Toasty + skeletony + lepsze stany ładowania — V1 (toasty/skeleton) + V6 (rozszerzenie)

---

## 9. Strategia testów (wiążąca)

- **Unit (vitest, bez DOM):** czyste funkcje w `src/lib/predictions/derive.ts`
  i `src/lib/stats/player.ts` — filtrowanie wg grupy/statusu/search, sortowanie po dacie,
  liczenie statusu typu, skuteczność/agregaty. To główny ciężar testów.
- **Component (vitest + @testing-library/react + jsdom):** kluczowe interakcje —
  toolbar zmienia widoczne mecze; autosave wywołuje akcję po debounce (z `vi.useFakeTimers`
  i zamockowanym `savePrediction`); podium renderuje top 3 we właściwej kolejności.
- **Mockowanie:** Server Actions i `next/navigation` mockowane (`vi.mock`). Sieć/Supabase
  nie jest dotykana w testach komponentów.
- **Zakres minimalny per faza** opisany w danym tickecie w sekcji „Testy".
- **Bramka jakości:** każda faza kończy się zielonym `pnpm test`, `pnpm lint`, `pnpm build`.

---

## 10. Definition of Done (każda faza)
- Kryteria akceptacji fazy spełnione i zweryfikowane manualnie (light + dark, mobile + desktop).
- Logika wydzielona do czystych funkcji i pokryta unit-testami; kluczowe interakcje testem komponentu.
- `pnpm test`, `pnpm lint`, `pnpm build` przechodzą (zero błędów typów).
- Brak zmian w DB/RLS/scoring/Server Actions (poza dozwolonym zakresem fazy).
- Commit `V<faza>: <opis>`. Repo w stanie uruchamialnym.
