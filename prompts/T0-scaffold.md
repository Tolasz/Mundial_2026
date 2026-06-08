# T0 — Scaffold repo + tooling

> Najpierw zastosuj `prompts/00-orchestrator.md`. Następnie wykonaj poniższe.

**Zależności:** brak.

```
Realizujesz ticket T0 (Scaffold repo + tooling). Pracuj wg 00-orchestrator.md i PLAN.md.

Kontekst:
- To start projektu od zera w katalogu repo (obecnie pusty poza PLAN.md/prompts/).

Zadanie krok po kroku:
1. Zainicjuj Next.js 15 (App Router, TypeScript, ESLint) z pnpm w katalogu repo
   (nie twórz podfolderu — projekt w roocie).
2. Skonfiguruj Tailwind CSS v4 i shadcn/ui. Ustaw dark mode jako domyślny (class strategy)
   z dostępnym przełącznikiem (komponent ThemeToggle, next-themes lub własny provider).
3. Dodaj vitest + @testing-library/react + jsdom; skonfiguruj `pnpm test`.
   Dodaj jeden przykładowy przechodzący test (np. render strony startowej).
4. Utwórz `.env.example` ze wszystkimi zmiennymi z PLAN.md (sekcja "Zmienne środowiskowe").
   Dodaj `.env.local` do .gitignore (jeśli nie ma).
5. Strona startowa po polsku (placeholder): nazwa appki + krótki opis + ThemeToggle.
6. README z instrukcją: instalacja, `pnpm dev`, `pnpm test`, `pnpm build`, lista env.
7. Przygotuj projekt pod Vercel (poprawny build; ewentualnie podstawowy `vercel.json` jeśli potrzebny).

Czego NIE robić:
- Bez Supabase, bez auth, bez logiki domenowej (to kolejne tickety).

Kryteria akceptacji:
- `pnpm dev` startuje; strona startowa działa; przełącznik dark/light działa.
- `pnpm test` przechodzi (>=1 test). `pnpm build` przechodzi bez błędów typów.
- `.env.example`, README i .gitignore na miejscu.

Definition of Done: jak w 00-orchestrator.md (test+build+commit "T0: scaffold + tooling").
```
