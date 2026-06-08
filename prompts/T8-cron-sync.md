# T8 — Cron sync wyników + przeliczenie punktów

> Najpierw zastosuj `prompts/00-orchestrator.md`. Następnie wykonaj poniższe.

**Zależności:** T5, T7.

```
Realizujesz ticket T8 (Cron sync wyników). Pracuj wg 00-orchestrator.md i PLAN.md.

Zadanie:
1. src/app/api/cron/sync-results/route.ts (Route Handler, runtime node):
   - Autoryzacja: wymagaj nagłówka/sekretu CRON_SECRET; brak/niezgodny => 401.
   - Pobierz wyniki przez football-api (T5). Dla każdego meczu z external_id zaktualizuj
     matches (status, home_score, away_score) używając klienta z service_role.
   - Dla meczów, które właśnie przeszły w status=finished, wywołaj recalc_match_points
     (ustaw predictions.points_awarded wg scoring z T7).
   - status=postponed => wyniki null, points_awarded null.
   - Zwróć podsumowanie (ile zaktualizowanych/rozliczonych). Łagodna obsługa błędów API.
2. vercel.json: harmonogram cron (np. "*/15 * * * *" — co 15 min). Udokumentuj w README,
   jak ustawić CRON_SECRET w Vercel.
3. Logika recalc może być w SQL (T1) lub w TS wykorzystując scoring.ts — bądź spójny.

Bezpieczeństwo:
- Endpoint niedostępny bez CRON_SECRET. service_role tylko po stronie serwera (nie w kliencie).

Kryteria akceptacji:
- Po zakończeniu meczu: status=finished, wynik zapisany, points_awarded wyliczone wszystkim graczom.
- Wywołanie bez/błędnym CRON_SECRET => 401.
- Mecz postponed => points_awarded null. Powtórne uruchomienie idempotentne.

Definition of Done: test+build+commit "T8: cron sync + przeliczenie punktów".
```
