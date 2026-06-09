# V6 — Polish (skeletony, empty states, champion, dostępność)

> Najpierw zastosuj `prompts/v2/00-orchestrator.md` i przeczytaj `prompts/v2/PLAN.md`.

**Zależności:** V1–V5 (faza domykająca). Wykonuj po ukończeniu pozostałych.

```
Realizujesz fazę V6 (Polish). Pracuj wg 00-orchestrator.md i PLAN.md.

Cel: domknąć redesign — spójne stany ładowania i puste, dopracowanie strony mistrza,
dostępność i ostatnie szlify. Bez nowych ficzerów i bez zmian w backendzie.

Zadanie:
1. Skeletony (prymityw Skeleton z V1) — ujednolić wszystkie loading.tsx:
   - (app)/predictions/loading.tsx, (app)/leaderboard/loading.tsx,
     (app)/champion/loading.tsx, oraz loading dla profilu i dashboardu (jeśli dodane).
   - Skeleton ma odwzorowywać układ docelowej strony (karty/tabela/podium), nie generyczny spinner.
2. Empty states — spójne, przyjazne komunikaty PL z ikoną lucide i ewentualnym CTA:
   - brak wyników filtrów (predictions), brak danych rankingu, brak rozliczonych meczów (profil),
     brak najbliższych meczów (dashboard).
3. Champion — src/app/(app)/champion/ChampionPicker.tsx polish:
   - Przebuduj na prymitywy/tokeny z V1 i TeamFlag; karty drużyn z grupowaniem.
   - Toasty (Sonner) na zapis/odrzucenie zamiast inline statusu (jeśli obecny).
   - Czytelny stan zablokowany / trafiony-mistrz po finale. Logika saveChampion BEZ ZMIAN.
4. Dostępność i szlif globalny:
   - Focus-visible na interaktywnych elementach; aria-label tam, gdzie ikony bez tekstu.
   - Respektuj prefers-reduced-motion dla animacji wejścia.
   - Sprawdź kontrast tokenów (AA) w light i dark. Zweryfikuj nawigację klawiaturą.
   - Drobne wyrównania spacingów/typografii dla spójności między stronami.
5. Aktualizacja metadanych/tytułu jeśli potrzeba (layout.tsx) — opcjonalnie.

Architektura:
- Tylko warstwa prezentacji. Żadnych zmian w Server Actions, RLS, scoringu, zapytaniach.
- Reużywaj prymitywów i tokenów z V1; nie wprowadzaj nowych zależności.

Testy:
- Smoke/component testy dla nowych empty states (renderują się, pokazują CTA gdy zadane).
- champion-picker.test.tsx: stan zablokowany blokuje wybór; toast na sukces (zamockowany
  saveChampion + toast). Nie testuj logiki serwera (poza zakresem).
- Upewnij się, że wszystkie istniejące testy nadal przechodzą po refaktorze wizualnym.

Kryteria akceptacji:
- Każda główna strona ma skeleton odwzorowujący jej układ.
- Spójne, przyjazne empty states we wszystkich miejscach pustych danych.
- Strona mistrza w nowym designie z toastami; stany lock/trafiony czytelne.
- Dostępność: focus-visible, aria-label, reduced-motion, kontrast AA (light+dark).
- pnpm test / lint / build zielone.

Definition of Done: testy+lint+build+commit "V6: polish (skeletony, empty states, champion, a11y)".
Podsumuj stan całego redesignu v2 i ewentualny dług do dalszych iteracji.
```
