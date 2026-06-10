-- ============================================================
-- 0006_expert_opinions.sql — Opinie ekspertów AI
-- ============================================================

-- Tabela przechowuje jedną aktualną opinię per persona (nadpisywana codziennie).
-- picks: JSONB, tablica obiektów:
--   { matchId, homeTeamName, awayTeamName, homeTeamShort, awayTeamShort,
--     kickoffAt, homeScore, awayScore, reason }
-- ============================================================

CREATE TABLE expert_opinions (
  persona        text        PRIMARY KEY,
  display_name   text        NOT NULL,
  intro          text        NOT NULL,
  picks          jsonb       NOT NULL DEFAULT '[]'::jsonb,
  generated_at   timestamptz NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- RLS
-- ------------------------------------------------------------
ALTER TABLE expert_opinions ENABLE ROW LEVEL SECURITY;

-- SELECT: wszyscy zalogowani (wzorzec z 0002_rls.sql)
CREATE POLICY "expert_opinions_select_authenticated"
  ON expert_opinions
  FOR SELECT
  TO authenticated
  USING (true);

-- Brak polityk INSERT/UPDATE/DELETE dla roli authenticated.
-- Tylko service_role (omija RLS) może pisać — używane przez cron i admina.
