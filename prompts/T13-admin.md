# T13 — Panel admina

> Najpierw zastosuj `prompts/00-orchestrator.md`. Następnie wykonaj poniższe.

**Zależności:** T2, T8.

```
Realizujesz ticket T13 (Panel admina). Pracuj wg 00-orchestrator.md i PLAN.md.

Zadanie:
1. src/app/(admin)/admin/* — dostęp tylko dla profiles.is_admin (guard server-side na layout/route;
   nie-admin nie wejdzie nawet po bezpośrednim URL).
2. Funkcje panelu:
   - Lista meczów z możliwością ręcznego wpisania/korekty wyniku (home_score, away_score, status)
     oraz przyciskiem "Przelicz punkty" (recalc_match_points dla meczu).
   - Ustawianie par pucharowych (home_team_id/away_team_id, kickoff_at) dla meczów stage != group.
   - Podgląd użytkowników (nick, punkty, czy admin).
   - (Opcjonalnie) przełącznik settings.tournament_started / champion_locked_at.
3. Akcje serwerowe przez service_role, KAŻDA z ponowną weryfikacją is_admin po stronie serwera.

Bezpieczeństwo:
- Każda mutacja sprawdza is_admin server-side (nie ufaj UI). service_role tylko na serwerze.

Kryteria akceptacji:
- Admin nadpisuje wynik -> punkty przeliczone (widać w rankingu).
- Nie-admin nie ma dostępu do panelu ani akcji (UI i serwer).

Definition of Done: test+build+commit "T13: panel admina".
```
