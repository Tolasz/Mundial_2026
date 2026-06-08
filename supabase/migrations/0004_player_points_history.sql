-- ============================================================
-- 0004_player_points_history.sql — Historia punktów gracza
-- Zależność: 0001_init.sql
-- ============================================================

-- Widok: player_points_history
-- Typ gracza + wynik meczu + punkty + suma narastająca per user
-- Tylko mecze po kickoffie (kickoff_at <= now())
CREATE OR REPLACE VIEW player_points_history AS
SELECT
  pr.user_id,
  pr.id              AS prediction_id,
  m.id               AS match_id,
  m.kickoff_at,
  m.stage,
  m."group",
  m.round_label,
  m.home_score,
  m.away_score,
  m.status,
  home_t.name        AS home_team_name,
  home_t.short_name  AS home_team_short,
  home_t.flag_url    AS home_team_flag,
  away_t.name        AS away_team_name,
  away_t.short_name  AS away_team_short,
  away_t.flag_url    AS away_team_flag,
  pr.home_pick,
  pr.away_pick,
  pr.points_awarded,
  COALESCE(
    SUM(pr.points_awarded) OVER (
      PARTITION BY pr.user_id
      ORDER BY m.kickoff_at
      ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ),
    0
  ) AS cumulative_points
FROM predictions pr
JOIN   matches m      ON m.id      = pr.match_id
LEFT JOIN teams home_t ON home_t.id = m.home_team_id
LEFT JOIN teams away_t ON away_t.id = m.away_team_id
WHERE m.kickoff_at <= now();
