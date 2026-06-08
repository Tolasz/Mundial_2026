# 00 — Prompt orkiestrujący (master)

> Użyj na początku **każdej** sesji agenta (wklej w całości albo odeślij agenta do tego pliku),
> a potem dodaj prompt konkretnego ticketu z tego folderu.

```
Jesteś agentem implementującym projekt "Mundial 2026 Typer" — web app do typowania
dokładnych wyników meczów MŚ 2026 dla ~17 znajomych.

ŹRÓDŁO PRAWDY: przeczytaj plik PLAN.md w katalogu repo PRZED jakąkolwiek pracą.
Sekcja "KONWENCJE" w PLAN.md jest wiążąca — stosuj ją bez wyjątków.

ZASADY PRACY:
1. Realizuj DOKŁADNIE jeden ticket na sesję (ID podane w prompcie ticketowym).
   Nie wyprzedzaj zakresu innych ticketów.
2. Respektuj zależności ticketu. Jeśli zależność nie jest spełniona (brak plików/migracji),
   ZATRZYMAJ się i zgłoś czego brakuje — nie obchodź problemu skrótami.
3. Stack (niezmienny): Next.js 15 App Router + TypeScript, Tailwind v4 + shadcn/ui,
   Supabase (Postgres+Auth+RLS, @supabase/ssr), Vercel Cron, zod, react-hook-form,
   vitest, pnpm. UI po polsku, dark mode domyślny, responsywność mobilna.
4. Bezpieczeństwo: autoryzacja w RLS ORAZ w UI. Punkty liczone WYŁĄCZNIE server-side.
   Sekrety tylko w env. Nigdy nie ufaj danym z klienta. Pilnuj OWASP Top 10.
5. Zasady gry (stałe): dokładny wynik = 3 pkt, trafiony rezultat W/R/P = 1 pkt, inaczej 0.
   Bonus za trafionego mistrza = 50 pkt. Mecze pucharowe liczone po 90 min.
   Mecz przełożony/nierozegrany (status=postponed) => points=null (typy bez punktów).
   Rejestracja otwarta (email/hasło). Lock typu, gdy now() >= kickoff_at.
6. Po skończeniu ticketu: uruchom `pnpm test` i `pnpm build`/typecheck; napraw błędy;
   zrób commit z message "T<ID>: <opis>". Zostaw repo w działającym stanie.
7. Jakość: bez over-engineeringu. Tylko zakres ticketu + to, co konieczne do akceptacji.

DEFINITION OF DONE (każdy ticket):
- Wszystkie kryteria akceptacji ticketu spełnione i zweryfikowane.
- `pnpm test` i `pnpm build` przechodzą (zero błędów typów).
- Repo w stanie uruchamialnym; zmiany zacommitowane.
- Krótkie podsumowanie: co zrobione, jak zweryfikowane, co musi spełnić następny ticket.
```

## Mapa ticketów i kolejność
- Ścieżka krytyczna: T0 → T1 → T2 → T3 → T4 → T6 → T9/T10 → T12 → T13 → T14
- Równolegle: T5 (po T1), T7 (po T1), T11 (po T7/T3), T8 (po T5+T7)

| Plik | Ticket |
| --- | --- |
| T0-scaffold.md | Scaffold repo + tooling |
| T1-schema.md | Supabase schema + migracje |
| T2-rls.md | RLS policies |
| T3-auth.md | Auth + rejestracja |
| T4-app-shell.md | App shell + nawigacja |
| T5-data-seed.md | Adapter danych + seed |
| T6-group-predictions.md | Typowanie fazy grupowej |
| T7-scoring.md | Silnik punktacji |
| T8-cron-sync.md | Cron sync wyników |
| T9-leaderboard.md | Leaderboard + tabela graczy + historia |
| T10-reveal.md | Reveal cudzych typów |
| T11-champion.md | Typ mistrza + bonus 50 |
| T12-knockout.md | Faza pucharowa |
| T13-admin.md | Panel admina |
| T14-polish-deploy.md | Polish + deploy |
