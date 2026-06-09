# V2 — Predictions Board (filtry / sort / search + autosave + toasty)

> Najpierw zastosuj `prompts/v2/00-orchestrator.md` i przeczytaj `prompts/v2/PLAN.md`.

**Zależności:** V1 (tokeny, prymitywy ui/, TeamFlag, Sonner).

```
Realizujesz fazę V2 (Predictions Board). Pracuj wg 00-orchestrator.md i PLAN.md.

Cel: przebudować stronę typowania w nowoczesny, użytkowy panel z filtrowaniem,
sortowaniem, wyszukiwaniem i autosave — bez zmian w backendzie.

Zadanie:
1. Czyste funkcje — src/lib/predictions/derive.ts (bez React/Supabase):
   - Typy DTO: MatchVM { id, group|null, stage, roundLabel|null, kickoffAt: string,
     home: TeamVM, away: TeamVM, prediction: {homePick,awayPick}|null, isLocked: boolean,
     predictionStatus: "empty"|"saved"|"locked" }.
   - deriveMatchStatus(match): zwraca predictionStatus na podstawie prediction + isLocked.
   - filterMatches(matches, { group, status, query }): filtr po grupie (A–L / "all"),
     po statusie typu (all/empty/saved/locked), po nazwie drużyny (query, case-insensitive,
     match na name lub short_name home/away).
   - sortMatches(matches, dir): sort po kickoffAt rosnąco/malejąco (stabilny).
   - Funkcje czyste, deterministyczne, w pełni testowalne.
2. Prezenter — src/components/predictions-board.tsx ("use client"):
   - Przyjmuje znormalizowane DTO z RSC (grupowe + pucharowe) + listę dostępnych grup.
   - Trzyma stan filtrów (grupa, status, query, sortDir) w useState (klienckie, natychmiastowe).
   - Renderuje toolbar + listę meczów pogrupowaną (faza grupowa wg grup, pucharowa wg etapów).
   - Liczy i pokazuje postęp typowania (filled/total) — opcjonalnie sticky na mobile.
   - Empty state, gdy filtry nie zwracają meczów (prymityw + komunikat PL).
3. Toolbar — src/components/predictions-toolbar.tsx ("use client"):
   - Filtr grupy (Tabs lub Select z ui/), filtr statusu (segmenty/tabs:
     Wszystkie / Nietypowane / Zapisane / Zablokowane), input wyszukiwarki drużyny
     (z ikoną lucide, debounce na query ~200 ms), przełącznik sortu po dacie (rosnąco/malejąco).
   - Dostępność: aria-label dla każdej kontrolki; działa klawiaturą.
4. Karta meczu — src/components/match-prediction-card.tsx (refaktor):
   - Użyj TeamFlag i prymitywów ui/. Usuń inline <img> z eslint-disable.
   - AUTOSAVE: po zmianie któregokolwiek inputu zapisz z debounce (~600 ms) wołając istniejące
     savePrediction (sygnatura bez zmian). Anuluj poprzedni timer przy kolejnej zmianie.
     Waliduj 0–99 po stronie klienta przed wysyłką; pomiń zapis, gdy oba pola puste/niezmienione.
   - Feedback: toast.success("Zapisano") / toast.error(błąd) zamiast inline statusu.
     Pokaż subtelny wskaźnik "zapisywanie…" w trakcie transition. Zablokowany mecz: brak edycji.
5. RSC — src/app/(app)/predictions/page.tsx:
   - Zostaje Server Component: auth + fetch (jak dziś, Promise.all). Zmapuj surowe wiersze do
     DTO (MatchVM) i przekaż do <PredictionsBoard/>. Logikę renderu przenieś do prezentera.
   - Zachowaj obecną widoczność cudzych typów po kickoffie (OthersPredictions) — wkomponuj
     w nowy layout karty/sekcji.

Architektura:
- RSC = dane; klient = interakcja. Cała logika filtrów/sortu w derive.ts (czyste funkcje).
- Brak zmian w savePrediction ani RLS. Autosave to wyłącznie zmiana UX po stronie klienta.
- Debounce zaimplementuj prosto (useRef + setTimeout) lub małym hookiem useDebouncedCallback.

Testy:
- derive.test.ts (vitest, bez DOM): filterMatches po grupie/statusie/query (w tym brak wyników,
  case-insensitive, dopasowanie po short_name); sortMatches obie kierunki + stabilność;
  deriveMatchStatus dla empty/saved/locked.
- predictions-toolbar/board.test.tsx (@testing-library/react): zmiana filtra statusu na
  "Nietypowane" pokazuje tylko mecze bez typu; wpisanie nazwy drużyny zawęża listę;
  przełącznik sortu zmienia kolejność.
- match-prediction-card.test.tsx: z vi.useFakeTimers + zamockowanym savePrediction —
  zmiana wyniku wywołuje savePrediction RAZ po debounce (nie przy każdym znaku);
  sukces pokazuje toast (toast zamockowany); walidacja blokuje wartości spoza 0–99.

Kryteria akceptacji:
- Filtr grupy, filtr statusu, wyszukiwarka i sort po dacie działają natychmiast, bez przeładowania.
- Autosave zapisuje typ po debounce; toast potwierdza zapis/błąd; brak przycisku "Zapisz".
- Zablokowane mecze nieedytowalne; cudze typy widoczne po kickoffie jak dotąd.
- Pusty wynik filtrów pokazuje czytelny empty state. Mobile i desktop OK, light+dark OK.
- pnpm test / lint / build zielone.

Definition of Done: testy+lint+build+commit "V2: predictions board (filtry/sort/search + autosave)".
```
