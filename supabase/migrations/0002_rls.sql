-- ============================================================
-- 0002_rls.sql — Mundial Typer 2026 — Row Level Security policies
-- Zależność: 0001_init.sql (RLS już włączone na wszystkich tabelach)
-- ============================================================

-- ============================
-- TEAMS — SELECT dla zalogowanych
-- ============================
CREATE POLICY "teams_select_authenticated"
  ON teams
  FOR SELECT
  TO authenticated
  USING (true);

-- ============================
-- MATCHES — SELECT dla zalogowanych
-- ============================
CREATE POLICY "matches_select_authenticated"
  ON matches
  FOR SELECT
  TO authenticated
  USING (true);

-- ============================
-- PROFILES
-- ============================

-- SELECT: wszyscy zalogowani (do rankingu i nicków)
CREATE POLICY "profiles_select_authenticated"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- UPDATE: tylko własny wiersz
CREATE POLICY "profiles_update_own"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Trigger chroniący kolumnę is_admin przed zmianą przez zwykłego usera.
-- Zalogowany user (auth.uid() IS NOT NULL) nie może zmienić is_admin.
-- service_role pomija JWT → auth.uid() zwraca NULL → zmiana dozwolona.
CREATE OR REPLACE FUNCTION protect_is_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Tylko zapytania z kontekstem JWT (auth.uid() != NULL) blokujemy.
  -- Wywołania przez service_role nie mają JWT → auth.uid() = NULL → OK.
  IF auth.uid() IS NOT NULL THEN
    NEW.is_admin := OLD.is_admin;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_protect_is_admin
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION protect_is_admin();

-- ============================
-- PREDICTIONS
-- ============================

-- SELECT:
--   - własne typy: zawsze
--   - cudze typy: tylko gdy now() >= kickoff_at meczu
CREATE POLICY "predictions_select"
  ON predictions
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR now() >= (SELECT kickoff_at FROM matches WHERE id = match_id)
  );

-- INSERT: tylko własny wiersz i przed kickoffem
CREATE POLICY "predictions_insert"
  ON predictions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND now() < (SELECT kickoff_at FROM matches WHERE id = match_id)
  );

-- UPDATE: tylko własny wiersz i przed kickoffem
CREATE POLICY "predictions_update"
  ON predictions
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id
    AND now() < (SELECT kickoff_at FROM matches WHERE id = match_id)
  )
  WITH CHECK (
    auth.uid() = user_id
    AND now() < (SELECT kickoff_at FROM matches WHERE id = match_id)
  );

-- DELETE: brak polityki → operacja zabroniona dla wszystkich ról (deny-all)

-- ============================
-- INVITE_CODES
-- Brak polityk → brak dostępu dla anon i authenticated.
-- Obsługa wyłącznie przez Server Action z service_role (pomija RLS).
-- ============================

-- ============================
-- SETTINGS
-- ============================

-- SELECT: wszyscy zalogowani
CREATE POLICY "settings_select_authenticated"
  ON settings
  FOR SELECT
  TO authenticated
  USING (true);

-- UPDATE: tylko admin (is_admin = true) lub service_role
CREATE POLICY "settings_update_admin"
  ON settings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );
