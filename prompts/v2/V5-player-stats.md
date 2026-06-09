# V5 — Statystyki gracza (profil)

> Najpierw zastosuj `prompts/v2/00-orchestrator.md` i przeczytaj `prompts/v2/PLAN.md`.

**Zależności:** V1 (tokeny, prymitywy ui/). Niezależne od V2/V3/V4.

```
Realizujesz fazę V5 (Statystyki gracza). Pracuj wg 00-orchestrator.md i PLAN.md.

Cel: rozbudować stronę profilu gracza (/leaderboard/[userId]) o czytelne statystyki i
proste wizualizacje, ponad istniejącą tabelę historii. Bez zmian w backendzie/widokach.

Zadanie:
1. Czyste funkcje — src/lib/stats/player.ts (bez React/Supabase):
   - Na bazie wierszy z player_points_history (rozliczone mecze) policz:
     totalSettled (rozliczone typy), exactHits (3 pkt), resultHits (1 pkt), missHits (0 pkt),
     accuracyPct (skuteczność = (exact+result)/settled), avgPointsPerMatch,
     bestStreak (najdłuższa seria meczów z punktami > 0), pointsByStage (agregacja per etap).
   - buildStatsVM(historyRows, leaderboardRow): łączy powyższe + championBonus + totalPoints.
   - Deterministyczne, odporne na pustą historię (zera, brak dzielenia przez 0), testowalne.
2. Komponent — src/components/player-stats.tsx:
   - Sekcja kart-statystyk (prymitywy Card/Badge z V1): punkty łącznie, skuteczność,
     liczba 3/1/0 pkt, najlepsza seria, średnia/mecz.
   - Prosta wizualizacja rozkładu trafień (np. paski proporcji 3/1/0 pkt — czysty CSS/divy
     z tokenami statusu z V1, bez zewnętrznej biblioteki wykresów).
   - Spójne z motywem; dostępne (etykiety, wartości liczbowe tabular-nums).
3. Strona — src/app/(app)/leaderboard/[userId]/page.tsx:
   - Zostaje Server Component: auth + istniejące fetch (profil, player_points_history,
     leaderboard row) bez zmian zapytań. Zmapuj do StatsVM (buildStatsVM) i wyrenderuj
     <PlayerStats/> NAD istniejącą tabelą historii (tabelę zachowaj/odśwież wizualnie na ui/).
   - Zachowaj link powrotny do rankingu i obsługę notFound dla nieistniejącego usera.

Architektura:
- Cała matematyka statystyk w src/lib/stats/player.ts (czyste funkcje) — komponent tylko prezentuje.
- Brak zewnętrznych bibliotek wykresów (wizualizacja na divach + tokeny).
- Brak zmian w widokach DB ani Server Actions.

Testy:
- stats/player.test.ts: poprawne zliczenia exact/result/miss; accuracyPct (w tym pusty zbiór → 0,
  bez dzielenia przez zero); bestStreak na sekwencjach z przerwami; pointsByStage agreguje per etap;
  buildStatsVM uwzględnia championBonus i totalPoints.
- player-stats.test.tsx: renderuje kluczowe metryki i paski rozkładu; obsługuje brak historii
  (pokazuje zera / stan pusty zamiast NaN).

Kryteria akceptacji:
- Profil pokazuje statystyki (skuteczność, rozkład 3/1/0, seria, średnia) ponad historią.
- Poprawne wartości dla gracza z historią oraz brak błędów dla gracza bez rozliczonych meczów.
- Spójny wygląd z resztą v2; mobile+desktop, light+dark OK.
- pnpm test / lint / build zielone.

Definition of Done: testy+lint+build+commit "V5: statystyki gracza na profilu".
```
