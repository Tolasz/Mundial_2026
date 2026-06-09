# T11 — Typ mistrza + bonus 20 pkt

> Najpierw zastosuj `prompts/00-orchestrator.md`. Następnie wykonaj poniższe.

**Zależności:** T3, T7.

```
Realizujesz ticket T11 (Typ mistrza + bonus 20). Pracuj wg 00-orchestrator.md i PLAN.md.

Zadanie:
1. src/app/(app)/champion/page.tsx — wybór mistrza turnieju:
   - Lista drużyn; zapis do profiles.champion_team_id przez Server Action saveChampion.
   - Zmiana zablokowana po starcie turnieju: jeśli settings.tournament_started === true
     lub now() >= settings.champion_locked_at => odrzuć zmianę (UI i serwer).
2. Logika bonusu:
   - Gdy znany mistrz turnieju (finał rozliczony — drużyna-zwycięzca finału), gracze
     z champion_team_id == mistrz dostają +settings.championship_bonus_points (20) do sumy.
   - Uwzględnij w agregacji leaderboard (T9) i/lub w recalc po finale.
3. Pokaż graczowi jego wybór i status (zablokowany/edytowalny, trafiony/nietrafiony po finale).

Kryteria akceptacji:
- Zmiana mistrza zablokowana po starcie turnieju (próba zapisu odrzucona server-side).
- Po finale gracze z trafionym mistrzem mają +20 pkt w rankingu; pozostali bez bonusu.
- Bonus liczony raz (idempotentnie).

Definition of Done: test+build+commit "T11: typ mistrza + bonus 20".
```
