# T2 — RLS policies

> Najpierw zastosuj `prompts/00-orchestrator.md`. Następnie wykonaj poniższe.

**Zależności:** T1.

```
Realizujesz ticket T2 (RLS policies). Pracuj wg 00-orchestrator.md i PLAN.md.

Zadanie:
Utwórz migrację supabase/migrations/0002_rls.sql z politykami:

- profiles:
  * SELECT: dozwolone wszystkim zalogowanym (do rankingu i nicków).
  * UPDATE: tylko własny wiersz (auth.uid() = id).
  * Kolumna is_admin NIE może być podniesiona przez usera — zabezpiecz triggerem lub
    polityką WITH CHECK (is_admin pozostaje niezmienione przy self-update).
- predictions:
  * SELECT własnych: zawsze (auth.uid() = user_id).
  * SELECT cudzych: tylko gdy now() >= (SELECT kickoff_at FROM matches WHERE id = match_id).
  * INSERT/UPDATE: tylko gdy auth.uid() = user_id AND now() < match.kickoff_at.
  * DELETE: zabronione (lub tylko własne przed kickoffem — wybierz brak DELETE).
- matches, teams:
  * SELECT: wszyscy zalogowani. Modyfikacja: tylko service_role/admin (brak polityk dla anon/user).
- settings:
  * SELECT: wszyscy zalogowani. UPDATE: tylko admin/service_role.

Następnie napisz skrypt/testy weryfikujące (supabase + role anon/auth):
- User A nie odczyta typu User B przed kickoffem; po kickoffie odczyta.
- User nie zapisze/edytuje typu po kickoffie (próba => odrzucona).
- User nie ustawi sobie is_admin=true.

Kryteria akceptacji:
- Migracja przechodzi; wszystkie trzy testy bezpieczeństwa potwierdzone (PASS).

Definition of Done: test+build+commit "T2: RLS policies".
```
