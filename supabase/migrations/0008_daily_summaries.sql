-- ============================================================
-- 0008_daily_summaries.sql — Podsumowania dnia AI
-- ============================================================

-- Tabela przechowuje jedno aktualne podsumowanie per persona (nadpisywane codziennie).
-- summary: długi tekst prozą, bez sztywnej struktury
-- matches_covered: JSONB, lista meczów objętych podsumowaniem:
--   [{ matchId, homeTeamName, awayTeamName, homeScore, awayScore, kickoffAt }]
-- ============================================================

CREATE TABLE daily_summaries (
  persona          text        PRIMARY KEY,
  display_name     text        NOT NULL,
  summary          text        NOT NULL,
  matches_covered  jsonb       NOT NULL DEFAULT '[]'::jsonb,
  generated_at     timestamptz NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- RLS
-- ------------------------------------------------------------
ALTER TABLE daily_summaries ENABLE ROW LEVEL SECURITY;

-- SELECT: wszyscy zalogowani (wzorzec z expert_opinions)
CREATE POLICY "daily_summaries_select_authenticated"
  ON daily_summaries
  FOR SELECT
  TO authenticated
  USING (true);

-- Brak polityk INSERT/UPDATE/DELETE dla roli authenticated.
-- Tylko service_role (omija RLS) może pisać — używane przez cron i admina.
