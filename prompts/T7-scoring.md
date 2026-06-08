# T7 — Silnik punktacji (czysta funkcja + testy)

> Najpierw zastosuj `prompts/00-orchestrator.md`. Następnie wykonaj poniższe.

**Zależności:** T1. Może iść równolegle z T6.

```
Realizujesz ticket T7 (Silnik punktacji). Pracuj wg 00-orchestrator.md i PLAN.md.

Zadanie:
1. src/lib/scoring.ts — czysta, bezstanowa funkcja:
   type Score = { home: number; away: number };
   type MatchResult = { home: number; away: number; status: 'finished'|'postponed'|... } | null;
   scorePrediction(pred: Score, result: MatchResult): number | null

   Reguły:
   - result === null lub status !== 'finished' (np. postponed) => zwróć null (typ bez punktów).
   - dokładny wynik (pred.home===result.home && pred.away===result.away) => 3.
   - trafiony rezultat (znak(pred.home-pred.away) === znak(result.home-result.away)) => 1.
   - w przeciwnym razie => 0.
   - Dla pucharu "result" to wynik po 90 min (zakładamy, że wołający podaje 90'),
     funkcja nie musi tego rozróżniać.
2. src/lib/scoring.test.ts (vitest) — przypadki:
   - 2:1 vs 2:1 = 3
   - 2:1 vs 3:0 = 1
   - 2:1 vs 0:2 = 0
   - 0:0 vs 0:0 = 3
   - 1:1 vs 2:2 = 1 (remis trafiony, wynik nie)
   - dowolny vs postponed/null = null
3. Upewnij się, że logika jest spójna z recalc_match_points w SQL (T1). Jeśli rozjazd —
   wyrównaj (źródłem prawdy reguł jest ten plik; SQL ma dawać te same wyniki).

Kryteria akceptacji:
- Wszystkie testy przechodzą; funkcja czysta (bez I/O, deterministyczna).

Definition of Done: test+build+commit "T7: silnik punktacji + testy".
```
