# T12 — Faza pucharowa

> Najpierw zastosuj `prompts/00-orchestrator.md`. Następnie wykonaj poniższe.

**Zależności:** T6, T8.

```
Realizujesz ticket T12 (Faza pucharowa). Pracuj wg 00-orchestrator.md i PLAN.md.

Zadanie:
1. Rozszerz widok typowania o sekcje fazy pucharowej (stage: r32, r16, qf, sf, final),
   prezentowane jako kolejne rundy/drabinka.
2. Odblokowanie: mecz pucharowy jest typowalny dopiero, gdy ustawione OBIE drużyny
   (home_team_id != null AND away_team_id != null). Wcześniej pokazuj "oczekuje na pary".
3. Punktacja po 90 min — scoring z T7 obsługuje to bez zmian; cron (T8) rozlicza tak samo.
4. Pary uzupełniane są przez admina/seed (mecze pucharowe mogą istnieć z null teams i być
   wypełniane po losowaniu/awansach). Upewnij się, że zapis typu respektuje lock kickoffu (RLS).

Kryteria akceptacji:
- Mecz pucharowy nietypowalny dopóki para nieznana; typowalny po ustaleniu obu drużyn.
- Typy pucharowe zapisują się i są rozliczane po 90 min wg reguł 3/1/0.
- Lock po kickoffie działa jak w fazie grupowej.

Definition of Done: test+build+commit "T12: faza pucharowa".
```
