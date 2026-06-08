# T1 — Supabase: schema + migracje

> Najpierw zastosuj `prompts/00-orchestrator.md`. Następnie wykonaj poniższe.

**Zależności:** T0.

```
Realizujesz ticket T1 (Supabase schema + migracje). Pracuj wg 00-orchestrator.md i PLAN.md.

Zadanie krok po kroku:
1. Skonfiguruj Supabase w projekcie (supabase CLI + folder supabase/). Dodaj zależności
   @supabase/supabase-js i @supabase/ssr.
2. Utwórz migrację supabase/migrations/0001_init.sql z PEŁNYM modelem danych z PLAN.md:
   - enumy: match_stage (group|r32|r16|qf|sf|final), match_status (scheduled|live|finished|postponed)
   - profiles (id uuid PK FK auth.users, nick text unique, is_admin bool default false,
     champion_team_id uuid null FK teams, created_at timestamptz default now())
   - teams (id uuid PK, name, short_name, flag_url, "group" char null, external_id text)
   - matches (id uuid PK, stage match_stage, "group" char null, home_team_id uuid null FK teams,
     away_team_id uuid null FK teams, kickoff_at timestamptz, home_score int null, away_score int null,
     status match_status default 'scheduled', external_id text, round_label text)
   - predictions (id uuid PK, user_id uuid FK profiles, match_id uuid FK matches,
     home_pick int, away_pick int, points_awarded int null, created_at, updated_at,
     UNIQUE(user_id, match_id), CHECK home_pick BETWEEN 0 AND 99, CHECK away_pick BETWEEN 0 AND 99)
   - invite_codes (code text PK, used_by uuid null FK profiles, used_at timestamptz null, created_at)
   - settings (id int PK default 1 CHECK id=1 [singleton], championship_bonus_points int default 50,
     tournament_started bool default false, champion_locked_at timestamptz null)
3. Dodaj funkcję recalc_match_points(p_match_id uuid): dla zakończonego meczu przelicza
   points_awarded wszystkich predictions wg reguł (3/1/0; postponed/brak wyniku => null).
   (Możesz zaimplementować logikę 3/1/0 wprost w SQL — będzie odzwierciedlać scoring z T7.)
4. Dodaj szkielet widoku/funkcji leaderboard (suma points_awarded + bonus mistrza per user).
5. Włącz RLS (ENABLE ROW LEVEL SECURITY) na wszystkich tabelach — BEZ polityk (to T2).
   Domyślny brak polityk = deny; dostęp serwisowy przez service_role.
6. Klienci Supabase: src/lib/supabase/server.ts, client.ts, middleware.ts (@supabase/ssr).
7. Wygeneruj typy DB do src/types/db.ts (supabase gen types) i podłącz do klientów.
8. Wstaw rekord domyślny do settings (id=1, championship_bonus_points=50).

Kryteria akceptacji:
- Migracja przechodzi na czystej bazie (supabase db reset / push).
- Typy generują się i kompilują. Klienci server/client działają (smoke test importu).
- RLS włączone na tabelach; settings ma rekord z bonusem 50.

Definition of Done: test+build+commit "T1: schema + migracje + klienci".
```
