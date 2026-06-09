# V3 — Leaderboard (podium top 3 + ulepszona tabela)

> Najpierw zastosuj `prompts/v2/00-orchestrator.md` i przeczytaj `prompts/v2/PLAN.md`.

**Zależności:** V1 (tokeny, prymitywy ui/). Niezależne od V2/V4/V5.

```
Realizujesz fazę V3 (Leaderboard redesign). Pracuj wg 00-orchestrator.md i PLAN.md.

Cel: zamienić surową tabelę rankingu w nowoczesny widok z wizualnym podium top 3
i czytelną, wyróżniającą gracza tabelą. Bez zmian w widoku DB `leaderboard`.

Zadanie:
1. Czyste funkcje — src/lib/leaderboard/derive.ts (bez React/Supabase):
   - Typ LeaderRow VM (user_id, nick, totalPoints, exactHits, resultHits, predictedCount,
     championBonus, rank, isCurrentUser).
   - rankRows(rows, currentUserId): nadaje pozycje (ties wg total_points, potem exact_hits —
     zgodnie z obecnym order), oznacza currentUser, zwraca { podium: top3, rest: reszta }.
   - Deterministyczne i testowalne.
2. Podium — src/components/leaderboard-podium.tsx:
   - Wizualne podium dla top 3 (układ: 2-1-3 na desktop, lista na mobile). Wyróżnienie złotem
     (token akcentu z V1) dla 1. miejsca; medale/oznaczenia dla 2 i 3.
   - Pokazuje nick, punkty, znacznik bonusu mistrza (★) jeśli championBonus > 0.
   - Link do profilu gracza (/leaderboard/[userId]).
3. Tabela — src/components/leaderboard-table.tsx:
   - Reszta graczy (poza podium) jako tabela na prymitywach/tokenach z V1.
   - Highlight wiersza bieżącego gracza (bg-primary/akcent), badge "(Ty)".
   - Kolumny responsywne (jak dziś: 3pkt/1pkt/typy chowane na mniejszych ekranach).
   - Empty state, gdy brak danych rankingowych.
4. RSC — src/app/(app)/leaderboard/page.tsx:
   - Zostaje Server Component: auth + fetch z widoku leaderboard (bez zmian zapytania).
   - Zmapuj do VM, podziel na podium/rest (rankRows), wyrenderuj <LeaderboardPodium/> +
     <LeaderboardTable/>. Zachowaj legendę punktacji u dołu.

Architektura:
- Logika rankingu/podziału w derive.ts (czyste funkcje); komponenty tylko prezentują.
- Brak zmian w widoku leaderboard ani w scoringu. Tylko warstwa prezentacji.

Testy:
- leaderboard/derive.test.ts: rankRows nadaje poprawne pozycje (w tym remisy rozstrzygane
  exact_hits), wyodrębnia dokładnie top3 do podium, oznacza isCurrentUser, obsługuje
  < 3 graczy i pustą listę.
- leaderboard-podium.test.tsx: renderuje 3 graczy w kolejności 1-2-3; pokazuje ★ gdy bonus>0.
- leaderboard-table.test.tsx: wyróżnia wiersz bieżącego gracza i pokazuje badge "(Ty)".

Kryteria akceptacji:
- Podium pokazuje top 3 we właściwej kolejności, z wyróżnieniem 1. miejsca.
- Tabela poprawnie wyróżnia bieżącego gracza; bonus mistrza oznaczony; legenda obecna.
- Działa dla 0, 1, 2, 3 i wielu graczy. Mobile+desktop, light+dark OK.
- pnpm test / lint / build zielone.

Definition of Done: testy+lint+build+commit "V3: leaderboard podium + ulepszona tabela".
```
