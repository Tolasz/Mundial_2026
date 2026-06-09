# V4 — Dashboard / strona główna (powitanie + najbliższe mecze + przypomnienia)

> Najpierw zastosuj `prompts/v2/00-orchestrator.md` i przeczytaj `prompts/v2/PLAN.md`.

**Zależności:** V1 (tokeny, prymitywy ui/, TeamFlag). Niezależne od V2/V3/V5.

```
Realizujesz fazę V4 (Dashboard / strona główna). Pracuj wg 00-orchestrator.md i PLAN.md.

Cel: zamienić goły redirect strony głównej na powitalny dashboard, który od razu pokazuje
graczowi co istotne: kim jest, ile ma punktów/pozycję, najbliższe mecze i czego jeszcze
nie wytypował. Bez zmian w backendzie.

Zadanie:
1. Czyste funkcje — src/lib/dashboard/derive.ts (bez React/Supabase):
   - upcomingMatches(matches, now, limit): najbliższe NIEROZPOCZĘTE mecze (kickoff > now),
     posortowane rosnąco, ograniczone do limit.
   - missingPredictions(matches, predictions, now): mecze otwarte do typowania (przed kickoff,
     z ustalonymi drużynami) BEZ typu gracza — do przypomnienia.
   - countdownLabel(kickoffAt, now): czytelna etykieta PL ("za 2 godz.", "jutro 18:00", itd.).
   - Deterministyczne, testowalne.
2. Sekcje dashboardu — src/components/dashboard/*:
   - WelcomeHero: powitanie po nicku ("Cześć, {nick}!"), krótki podtytuł, ewentualnie pozycja
     w rankingu i suma punktów (z widoku leaderboard).
   - UpcomingMatches: karty najbliższych meczów (TeamFlag, data/godzina, countdown,
     status typu: wytypowany/brak). CTA do /predictions.
   - MissingPredictionsAlert: jeśli są nietypowane otwarte mecze — wyróżniony alert z liczbą
     i linkiem do /predictions (z prefiltrem "Nietypowane", jeśli wykonalne przez query/hash).
   - QuickLinks: skróty do Ranking / Mistrz / Typy.
3. Strona — src/app/page.tsx:
   - Zamiast redirect("/predictions"): Server Component sprawdzający usera (brak → /login),
     pobierający potrzebne dane (najbliższe mecze, typy usera, pozycja z leaderboard),
     mapujący do VM i renderujący dashboard. Reużyj wzorców fetchu z istniejących stron.
   - Uwaga: page.tsx jest poza grupą (app); zadbaj o spójny AppHeader/layout (osadź w shellu
     analogicznym do (app)/layout.tsx — header + container). Nie duplikuj logiki auth bez potrzeby.
4. Nawigacja:
   - Dodaj pozycję "Start"/"Pulpit" w NAV_LINKS (app-header.tsx) wskazującą "/", uwzględnioną
     w desktop-nav i mobile-nav. Aktywny stan dla "/" nie może kolidować z innymi (uważaj na
     pathname.startsWith — dla "/" użyj dokładnego dopasowania).

Architektura:
- RSC pobiera i mapuje; sekcje dashboardu są w większości prezentacyjne (Server Components,
  chyba że potrzebny stan/countdown na żywo — wtedy mały "use client" wyspowo).
- Logika wyboru najbliższych meczów i braków w derive.ts (czyste funkcje).
- Brak zmian w Server Actions/RLS.

Testy:
- dashboard/derive.test.ts: upcomingMatches pomija mecze przeszłe i tnie do limitu w kolejności;
  missingPredictions zwraca tylko otwarte mecze bez typu (pomija zablokowane i już wytypowane);
  countdownLabel formatuje typowe przypadki (za X godz., jutro, dziś).
- Co najmniej smoke/component test dla MissingPredictionsAlert (pokazuje liczbę braków;
  ukrywa się gdy 0) i UpcomingMatches (renderuje listę z TeamFlag).

Kryteria akceptacji:
- Strona "/" pokazuje powitalny dashboard (nie redirect); niezalogowany → /login.
- Widoczne: powitanie po nicku, najbliższe mecze, przypomnienie o brakujących typach, skróty.
- Nawigacja zawiera link do dashboardu z poprawnym aktywnym stanem. Mobile+desktop, light+dark OK.
- pnpm test / lint / build zielone.

Definition of Done: testy+lint+build+commit "V4: dashboard powitalny + najbliższe mecze".
```
