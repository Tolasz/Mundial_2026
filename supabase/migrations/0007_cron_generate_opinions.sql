-- ============================================================
-- 0007_cron_generate_opinions.sql — Harmonogram generowania opinii ekspertów
-- Wzorzec identyczny z 0005_cron_sync_results.sql.
--
-- pg_cron   -> codziennie o 04:00 UTC (= 06:00 PL latem)
-- pg_net    -> HTTP GET na endpoint /api/cron/generate-opinions
-- Vault     -> przechowuje URL + CRON_SECRET
--
-- WYMAGANE PO MIGRACJI: wstaw sekrety do Vault — patrz
--   supabase/cron_secrets.example.sql
-- ============================================================

-- Rozszerzenia są już aktywne z migracji 0005, ale CREATE IF NOT EXISTS
-- jest idempotentne, więc nie szkodzi powtórzyć.
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS supabase_vault;

-- ------------------------------------------------------------
-- Funkcja wyzwalająca generowanie opinii
-- Czyta URL + sekret z Vault i robi autoryzowany HTTP GET.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trigger_generate_opinions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, net, vault
AS $$
DECLARE
  v_url    text;
  v_secret text;
BEGIN
  SELECT decrypted_secret INTO v_url
  FROM vault.decrypted_secrets
  WHERE name = 'generate_opinions_url';

  SELECT decrypted_secret INTO v_secret
  FROM vault.decrypted_secrets
  WHERE name = 'cron_secret';

  IF v_url IS NULL OR v_secret IS NULL THEN
    RAISE WARNING 'trigger_generate_opinions: brak sekretów w Vault (generate_opinions_url / cron_secret)';
    RETURN;
  END IF;

  PERFORM net.http_get(
    url     => v_url,
    headers => jsonb_build_object('Authorization', 'Bearer ' || v_secret),
    -- generowanie opinii wymaga wywołań LLM per persona — dajemy duży zapas
    timeout_milliseconds => 120000
  );
END;
$$;

REVOKE ALL ON FUNCTION public.trigger_generate_opinions() FROM PUBLIC;

-- ------------------------------------------------------------
-- Harmonogram: codziennie 04:00 UTC (= 06:00 czasu polskiego latem)
-- ------------------------------------------------------------
SELECT cron.schedule(
  'generate-opinions-daily',
  '0 4 * * *',
  $$SELECT public.trigger_generate_opinions();$$
);
