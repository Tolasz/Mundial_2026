# T9 — Leaderboard + tabela wyników graczy + historia punktów

> Najpierw zastosuj `prompts/00-orchestrator.md`. Następnie wykonaj poniższe.

**Zależności:** T7, T8.

```
Realizujesz ticket T9 (Leaderboard + tabela graczy + historia punktów). Pracuj wg 00-orchestrator.md i PLAN.md.

Zadanie:
1. src/app/(app)/leaderboard/page.tsx — ranking live:
   - Suma punktów gracza = SUM(points_awarded) + bonus mistrza (jeśli przyznany, 50 pkt).
   - Sortowanie malejąco; pozycje (1., 2., ...); remisy rozstrzygane liczbą dokładnych trafień.
   - Tabela wyników graczy z kolumnami: pozycja, nick, punkty, # dokładnych trafień (3 pkt),
     # trafionych rezultatów (1 pkt), # wytypowanych meczów.
   - Każdy nick to link do historii gracza.
2. src/app/(app)/leaderboard/[userId]/page.tsx — historia punktów gracza:
   - Lista meczów (po kickoffie / rozliczonych): drużyny, wynik końcowy, typ gracza,
     punkty za mecz.
   - Suma narastająco (timeline): kolejne punkty kumulowane w czasie (kolejność po kickoff_at).
   - Bonus mistrza jako osobna pozycja (gdy przyznany).
3. Dane:
   - Widok/funkcja leaderboard (agregacja per user) z bazy.
   - Widok player_points_history = predictions JOIN matches (tylko mecze po kickoffie/rozliczone),
     posortowane po kickoff_at, z kolumną punktów i sumą narastającą.
4. Responsywność: na mobile tabela czytelna (scroll/zwijanie kolumn).

Kryteria akceptacji:
- Suma punktów poprawna; ranking aktualizuje się po syncu (T8).
- Tabela graczy pokazuje statystyki (dokładne/rezultaty/liczba typów).
- Wejście w gracza pokazuje per-mecz punkty oraz sumę narastającą; bonus mistrza widoczny osobno.
- Działa na mobile.

Definition of Done: test+build+commit "T9: leaderboard + tabela graczy + historia punktów".
```
