# 00 — Orchestrator v2 (redesign frontendu)

> Użyj na początku **każdej** sesji agenta dla iteracji v2 (wklej w całości albo odeślij
> agenta do tego pliku), a następnie dodaj prompt konkretnej fazy z tego folderu (`V1`–`V6`).

```
Jesteś agentem realizującym ITERACJĘ v2 projektu "Mundial 2026 Typer": pełny redesign
frontendu (kierunek nowoczesny sportowy/mundialowy) + nowe ficzery UX. Aplikacja służy
~17 znajomym do typowania dokładnych wyników meczów MŚ 2026.

ŹRÓDŁO PRAWDY: przeczytaj prompts/v2/PLAN.md PRZED jakąkolwiek pracą. Sekcje
"Decyzje architektoniczne", "Architektura komponentów" i "Strategia testów" są wiążące.
Dla zasad gry i danych zerknij też do głównego PLAN.md (warstwa backendu się nie zmienia).

ZASADY PRACY:
1. Realizuj DOKŁADNIE jedną fazę na sesję (V1–V6, ID w prompcie fazy). Nie wyprzedzaj zakresu.
2. Respektuj zależności. V2–V5 wymagają ukończonego V1. Jeśli brakuje fundamentu (tokeny,
   prymitywy, Sonner) — ZATRZYMAJ się i zgłoś, nie obchodź skrótami.
3. NIE RUSZAJ backendu: schemat DB, migracje, RLS, logika scoringu (recalc_match_points,
   widok leaderboard) oraz sygnatury Server Actions (savePrediction, saveChampion) pozostają
   bez zmian. Pracujesz tylko w warstwie prezentacji (RSC fetch + komponenty klienckie).
4. Granica RSC/klient: strony page.tsx zostają Server Components (auth + fetch). Cała
   interaktywność (filtry, sort, search, autosave) w komponentach "use client". Do klienta
   przekazuj znormalizowane DTO, nie surowe wiersze Supabase.
5. Filtry/sort/search są KLIENCKIE i natychmiastowe — dane pobrane raz przez RSC, brak
   round-tripów. Logikę filtrowania/sortowania/statystyk wydziel do CZYSTYCH FUNKCJI
   w src/lib/** (bez React/Supabase), aby była testowalna unitowo.
6. Zapis typów: AUTOSAVE z debounce (~600 ms), bez przycisku "Zapisz". Feedback przez toast
   (Sonner). Walidacja kliencka przed wysyłką; serwer pozostaje źródłem prawdy.
7. Design tokens, nie hardkody: kolory wyłącznie przez zmienne CSS / klasy tokenów. Żadnych
   surowych hexów w komponentach. Spójność light/dark obowiązkowa.
8. UI po polsku. Mobile-first i responsywność. Dostępność: aria-label na kontrolkach,
   focus-visible, respektuj prefers-reduced-motion. Flagi przez komponent TeamFlag.
9. Bezpieczeństwo: nie ufaj danym z klienta; nie omijaj RLS; nie loguj sekretów. OWASP Top 10.
10. Jakość: bez over-engineeringu. Tylko zakres fazy + to, co konieczne do akceptacji.

DEFINITION OF DONE (każda faza):
- Kryteria akceptacji fazy spełnione i zweryfikowane manualnie (light+dark, mobile+desktop).
- Logika w czystych funkcjach pokryta unit-testami; kluczowe interakcje testem komponentu
  (@testing-library/react + jsdom; Server Actions i next/navigation mockowane).
- `pnpm test`, `pnpm lint`, `pnpm build` przechodzą (zero błędów typów).
- Brak zmian w DB/RLS/scoring/Server Actions poza dozwolonym zakresem fazy.
- Commit "V<faza>: <opis>". Repo w stanie uruchamialnym.
- Krótkie podsumowanie: co zrobione, jak zweryfikowane, co dziedziczą kolejne fazy.
```

## Mapa faz i kolejność
- Ścieżka: **V1 → (V2 ∥ V3 ∥ V4 ∥ V5) → V6**
- V1 jest fundamentem — blokuje wszystkie pozostałe.

| Plik | Faza |
| --- | --- |
| `V1-foundation.md` | Tokeny/paleta, prymitywy UI, TeamFlag, Sonner |
| `V2-predictions-board.md` | Filtry/sort/search + autosave + toasty |
| `V3-leaderboard.md` | Podium top 3 + ulepszona tabela |
| `V4-dashboard.md` | Strona główna / dashboard powitalny |
| `V5-player-stats.md` | Statystyki gracza na profilu |
| `V6-polish.md` | Skeletony, empty states, champion polish, a11y |

## Konwencje (skrót — pełne w PLAN.md)
- Komponenty klienckie: `"use client"` na górze; czysta logika importowana z `src/lib/**`.
- Prymitywy UI wzorowane na istniejącym `src/components/ui/button.tsx` (CVA + Base UI + `cn`).
- Toaster montowany raz w `src/app/layout.tsx`.
- Testy obok kodu lub w `*.test.ts(x)`; styl jak istniejące `scoring.test.ts` / `page.test.tsx`.
