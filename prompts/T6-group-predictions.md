# T6 — Typowanie fazy grupowej

> Najpierw zastosuj `prompts/00-orchestrator.md`. Następnie wykonaj poniższe.

**Zależności:** T4, T5.

```
Realizujesz ticket T6 (Typowanie fazy grupowej). Pracuj wg 00-orchestrator.md i PLAN.md.

Zadanie:
1. src/app/(app)/predictions/page.tsx — lista meczów fazy grupowej pogrupowana A–L
   (sekcje grup, w każdej mecze posortowane po kickoff_at).
2. Komponent MatchPredictionCard:
   - Drużyny (nazwa + flaga), data/godzina kickoffu, pola wyniku home/away (input number 0–99).
   - Stan: wytypowany / niewytypowany / zablokowany (po kickoffie).
   - Zapis przez Server Action savePrediction (zod: 0–99). Upsert do predictions (UNIQUE user+match).
3. Pasek postępu "X/72" (liczba wypełnionych typów użytkownika).
4. Lock: jeśli now() >= kickoff_at, pola tylko do odczytu; serwer i tak odrzuca zapis (RLS z T2).
5. Optymistyczny UI lub revalidatePath po zapisie; komunikaty po polsku.

Bezpieczeństwo:
- Walidacja zakresu i autoryzacji server-side. Nie polegaj wyłącznie na blokadzie w UI.

Kryteria akceptacji:
- Zapis i edycja typu działa przed kickoffem; walidacja 0–99 (błędne dane odrzucone).
- Po kickoffie edycja niemożliwa w UI; bezpośrednia próba zapisu przez action -> odrzucona (RLS).
- Pasek postępu pokazuje poprawną liczbę wytypowanych meczów.

Definition of Done: test+build+commit "T6: typowanie fazy grupowej".
```
