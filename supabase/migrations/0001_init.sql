-- ============================================================
-- 0001_init.sql — Mundial Typer 2026 — pełny model danych
-- ============================================================

-- ------------------------------------
-- ENUMy
-- ------------------------------------
CREATE TYPE match_stage AS ENUM ('group', 'r32', 'r16', 'qf', 'sf', 'final');
CREATE TYPE match_status AS ENUM ('scheduled', 'live', 'finished', 'postponed');

-- ------------------------------------
-- TABELE
-- ------------------------------------

CREATE TABLE teams (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text        NOT NULL,
  short_name   text        NOT NULL,
  flag_url     text        NOT NULL DEFAULT '',
  "group"      char(1)     NULL,  -- A–L; NULL dla fazy pucharowej
  external_id  text        NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE profiles (
  id                uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nick              text        NOT NULL UNIQUE,
  is_admin          boolean     NOT NULL DEFAULT false,
  champion_team_id  uuid        NULL REFERENCES teams(id) ON DELETE SET NULL,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE matches (
  id            uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  stage         match_stage   NOT NULL,
  "group"       char(1)       NULL,
  home_team_id  uuid          NULL REFERENCES teams(id) ON DELETE SET NULL,
  away_team_id  uuid          NULL REFERENCES teams(id) ON DELETE SET NULL,
  kickoff_at    timestamptz   NOT NULL,
  home_score    int           NULL,
  away_score    int           NULL,
  status        match_status  NOT NULL DEFAULT 'scheduled',
  external_id   text          NULL,
  round_label   text          NULL,
  created_at    timestamptz   NOT NULL DEFAULT now()
);

CREATE TABLE predictions (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  match_id        uuid        NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  home_pick       int         NOT NULL CHECK (home_pick BETWEEN 0 AND 99),
  away_pick       int         NOT NULL CHECK (away_pick BETWEEN 0 AND 99),
  points_awarded  int         NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, match_id)
);

CREATE TABLE invite_codes (
  code        text        PRIMARY KEY,
  used_by     uuid        NULL REFERENCES profiles(id) ON DELETE SET NULL,
  used_at     timestamptz NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE settings (
  id                        int         PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  championship_bonus_points int         NOT NULL DEFAULT 20,
  tournament_started        boolean     NOT NULL DEFAULT false,
  champion_locked_at        timestamptz NULL
);

-- ------------------------------------
-- REKORD DOMYŚLNY: settings
-- ------------------------------------
INSERT INTO settings (id, championship_bonus_points, tournament_started)
VALUES (1, 20, false);

-- ------------------------------------
-- INDEKSY
-- ------------------------------------
CREATE INDEX idx_matches_kickoff      ON matches (kickoff_at);
CREATE INDEX idx_matches_status       ON matches (status);
CREATE INDEX idx_predictions_user     ON predictions (user_id);
CREATE INDEX idx_predictions_match    ON predictions (match_id);
CREATE INDEX idx_predictions_points   ON predictions (points_awarded);

-- ------------------------------------
-- TRIGGER: updated_at dla predictions
-- ------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_predictions_updated_at
  BEFORE UPDATE ON predictions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ------------------------------------
-- FUNKCJA: recalc_match_points
-- Reguły punktacji:
--   - status != 'finished' lub brak home_score/away_score => points_awarded = NULL
--   - dokładny wynik (home_pick = home_score AND away_pick = away_score) => 3 pkt
--   - trafiony rezultat (W/R/P) => 1 pkt
--   - w przeciwnym razie => 0 pkt
-- ------------------------------------
CREATE OR REPLACE FUNCTION recalc_match_points(p_match_id uuid)
RETURNS void AS $$
DECLARE
  v_home_score  int;
  v_away_score  int;
  v_status      match_status;
BEGIN
  SELECT home_score, away_score, status
    INTO v_home_score, v_away_score, v_status
    FROM matches
   WHERE id = p_match_id;

  IF v_status != 'finished' OR v_home_score IS NULL OR v_away_score IS NULL THEN
    -- mecz niezakończony lub przełożony — kasujemy punkty
    UPDATE predictions
       SET points_awarded = NULL
     WHERE match_id = p_match_id;
    RETURN;
  END IF;

  UPDATE predictions
     SET points_awarded = CASE
           WHEN home_pick = v_home_score AND away_pick = v_away_score THEN 3
           WHEN SIGN(home_pick - away_pick) = SIGN(v_home_score - v_away_score) THEN 1
           ELSE 0
         END
   WHERE match_id = p_match_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------
-- WIDOK: leaderboard
-- suma points_awarded + bonus mistrza per user
-- ------------------------------------
CREATE OR REPLACE VIEW leaderboard AS
SELECT
  p.id                                                    AS user_id,
  p.nick,
  COALESCE(SUM(pr.points_awarded), 0)                     AS match_points,
  CASE
    WHEN p.champion_team_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM matches m
         WHERE m.stage = 'final'
           AND m.status = 'finished'
           AND (
             (m.home_score > m.away_score AND m.home_team_id = p.champion_team_id)
             OR (m.away_score > m.home_score AND m.away_team_id = p.champion_team_id)
             OR (m.home_score = m.away_score AND (
                   m.home_team_id = p.champion_team_id
                   OR m.away_team_id = p.champion_team_id
                 ))
           )
      )
    THEN (SELECT championship_bonus_points FROM settings WHERE id = 1)
    ELSE 0
  END                                                     AS champion_bonus,
  COALESCE(SUM(pr.points_awarded), 0)
    + CASE
        WHEN p.champion_team_id IS NOT NULL
          AND EXISTS (
            SELECT 1 FROM matches m
             WHERE m.stage = 'final'
               AND m.status = 'finished'
               AND (
                 (m.home_score > m.away_score AND m.home_team_id = p.champion_team_id)
                 OR (m.away_score > m.home_score AND m.away_team_id = p.champion_team_id)
                 OR (m.home_score = m.away_score AND (
                       m.home_team_id = p.champion_team_id
                       OR m.away_team_id = p.champion_team_id
                     ))
               )
          )
        THEN (SELECT championship_bonus_points FROM settings WHERE id = 1)
        ELSE 0
      END                                                 AS total_points,
  COUNT(pr.id) FILTER (WHERE pr.points_awarded IS NOT NULL) AS predicted_count,
  COUNT(pr.id) FILTER (WHERE pr.points_awarded = 3)         AS exact_hits,
  COUNT(pr.id) FILTER (WHERE pr.points_awarded = 1)         AS result_hits
FROM profiles p
LEFT JOIN predictions pr ON pr.user_id = p.id
GROUP BY p.id, p.nick, p.champion_team_id
ORDER BY total_points DESC, exact_hits DESC;

-- ------------------------------------
-- RLS — włączone, BEZ polityk (deny-all)
-- Polityki dodane w migracji T2
-- ------------------------------------
ALTER TABLE profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams        ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches      ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings     ENABLE ROW LEVEL SECURITY;
