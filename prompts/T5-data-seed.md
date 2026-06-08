# T5 — Adapter danych + seed

> Najpierw zastosuj `prompts/00-orchestrator.md`. Następnie wykonaj poniższe.

**Zależności:** T1. Może iść równolegle z T3/T4.

```
Realizujesz ticket T5 (Adapter danych + seed). Pracuj wg 00-orchestrator.md i PLAN.md.

Zadanie:
1. src/lib/football-api.ts:
   - Zdefiniuj interfejs FootballApi:
       getFixtures(): Promise<FixtureDTO[]>   // terminarz: drużyny, grupa, kickoff_at, external_id
       getResults(): Promise<ResultDTO[]>     // wyniki: external_id, home_score, away_score, status
   - Implementacja dla football-data.org (FOOTBALL_API_PROVIDER=football-data,
     FOOTBALL_API_KEY w env, nagłówek X-Auth-Token). Mapuj na DTO.
   - Łagodna obsługa błędów i limitów (429/5xx): retry/backoff lub czytelny błąd, bez crasha.
   - Nie wykonuj realnych zapytań w testach — wstrzykuj zależność/fetch i mockuj.
2. Seed: scripts/seed.ts (uruchamiany pnpm, service_role) — wypełnia:
   - teams: 12 grup A–L i drużyny (z API; fallback: zaszyta lista, jeśli API niedostępne).
   - matches: 72 mecze fazy grupowej z kickoff_at i external_id, status=scheduled.
   Idempotentny (ponowne uruchomienie nie duplikuje — upsert po external_id).
3. Krótki test jednostkowy mapowania DTO -> rekordy (na mocku odpowiedzi API).

Kryteria akceptacji:
- Seed tworzy 12 grup, drużyny i 72 mecze grupowe z poprawnymi kickoff_at (idempotentnie).
- Adapter pobiera wyniki; testy zielone na mocku (zero realnych zapytań w CI).

Definition of Done: test+build+commit "T5: football-api adapter + seed".
```
