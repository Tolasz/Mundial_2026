-- ============================================================
-- 0011_rank_history.sql — Dzienny snapshot pozycji w rankingu
--
-- Przechowuje pozycję każdego gracza z końca dnia, żeby można
-- było wyświetlać zmianę pozycji (↑ / ↓) w tabeli rankingu.
-- ============================================================

-- ------------------------------------
-- TABELA: leaderboard_snapshots
-- ------------------------------------
CREATE TABLE IF NOT EXISTS leaderboard_snapshots (
  id            bigserial    PRIMARY KEY,
  snapshot_date date         NOT NULL DEFAULT CURRENT_DATE,
  user_id       uuid         NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rank          int          NOT NULL,
  total_points  int          NOT NULL,
  UNIQUE (snapshot_date, user_id)
);

ALTER TABLE leaderboard_snapshots ENABLE ROW LEVEL SECURITY;

-- Wszyscy zalogowani mogą odczytywać snapshoty (do wyświetlania zmian pozycji)
DROP POLICY IF EXISTS "leaderboard_snapshots_read" ON leaderboard_snapshots;
CREATE POLICY "leaderboard_snapshots_read" ON leaderboard_snapshots
  FOR SELECT TO authenticated USING (true);

-- ------------------------------------
-- FUNKCJA: take_leaderboard_snapshot
-- Zapisuje aktualny ranking jako snapshot dla podanej daty.
-- Idempotentna — bezpieczne wielokrotne wywołanie w ciągu dnia.
-- ------------------------------------
CREATE OR REPLACE FUNCTION public.take_leaderboard_snapshot(
  p_date date DEFAULT CURRENT_DATE
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO leaderboard_snapshots (snapshot_date, user_id, rank, total_points)
  SELECT
    p_date,
    user_id,
    ROW_NUMBER() OVER (ORDER BY total_points DESC, exact_hits DESC)::int,
    total_points::int
  FROM leaderboard
  ON CONFLICT (snapshot_date, user_id) DO UPDATE
    SET rank         = EXCLUDED.rank,
        total_points = EXCLUDED.total_points;
END;
$$;

-- ------------------------------------
-- CRON: codziennie o 07:01 UTC (= 09:01 CEST)
-- Minutę po sync-results-morning (07:00 UTC) — wszystkie wyniki z nocy są już wgrane.
-- Snapshot reprezentuje ranking "na początek dnia" i służy do obliczenia
-- zmiany pozycji wyświetlanej w tabeli rankingu.
-- ------------------------------------
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 06:01 UTC — przed porannym syncem (snapshot "stanu sprzed dnia")
SELECT cron.schedule(
  'snapshot-leaderboard-morning',
  '1 6 * * *',
  $$SELECT public.take_leaderboard_snapshot(CURRENT_DATE - 1);$$
);

-- 07:01 UTC — po porannym syncrozacji wyników (snapshot z pełnymi wynikami)
SELECT cron.schedule(
  'snapshot-leaderboard-daily',
  '1 7 * * *',
  $$SELECT public.take_leaderboard_snapshot();$$
);
