# T14 — Polish + obsługa błędów + deploy

> Najpierw zastosuj `prompts/00-orchestrator.md`. Następnie wykonaj poniższe.

**Zależności:** wszystkie (T0–T13).

```
Realizujesz ticket T14 (Polish + deploy). Pracuj wg 00-orchestrator.md i PLAN.md.

Zadanie:
1. Stany globalne: error.tsx, loading.tsx, not-found.tsx (po polsku). Łagodna obsługa
   błędów/limitów API (komunikat zamiast crasha; retry tam, gdzie sensowne).
2. Dopracowanie UX: puste stany (brak typów, brak meczów, pusty ranking), spinnery/skeletony,
   spójny dark mode, responsywność na mobile we wszystkich widokach.
3. Deploy produkcyjny:
   - Skonfiguruj projekt na Vercel; ustaw wszystkie zmienne środowiskowe (w tym SERVICE_ROLE,
     FOOTBALL_API_KEY, CRON_SECRET).
   - Skonfiguruj Supabase (produkcyjna baza, migracje zastosowane, seed wykonany).
   - Włącz cron (vercel.json) i potwierdź, że sync działa na prod.
4. Smoke test E2E na prod: rejestracja kodem -> typ meczu -> (symulacja) wynik/sync -> ranking.

Kryteria akceptacji:
- Brak crashy przy błędzie API; widoczne czytelne komunikaty.
- Aplikacja publicznie dostępna pod URL i działa na mobile.
- Pełna ścieżka E2E (rejestracja -> typ -> sync -> ranking + historia) działa na produkcji.

Definition of Done: test+build+commit "T14: polish + obsługa błędów + deploy".
```
