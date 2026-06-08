# T10 — Reveal cudzych typów po kickoffie

> Najpierw zastosuj `prompts/00-orchestrator.md`. Następnie wykonaj poniższe.

**Zależności:** T2, T6.

```
Realizujesz ticket T10 (Reveal cudzych typów po kickoffie). Pracuj wg 00-orchestrator.md i PLAN.md.

Zadanie:
1. Komponent OthersPredictions — dla danego meczu pokazuje typy wszystkich graczy
   (nick + typ wyniku), ale TYLKO po kickoffie.
2. Osadź go w widoku meczu (rozwijane "Typy innych" / sekcja pod kartą meczu).
3. Egzekwowanie po stronie danych: zapytanie zwraca cudze typy tylko dla meczów po kickoffie
   (RLS z T2 już to wymusza — UI ma to odzwierciedlać, nie obchodzić).

Kryteria akceptacji:
- Przed kickoffem cudze typy są niedostępne (również przy bezpośredniej próbie pobrania danych).
- Po kickoffie typy wszystkich graczy widoczne dla danego meczu.
- Czytelne na mobile.

Definition of Done: test+build+commit "T10: reveal cudzych typów po kickoffie".
```
