-- ============================================================
-- 0009_cron_generate_summary.sql — Harmonogram generowania podsumowań dnia
-- Wzorzec identyczny z 0007_cron_generate_opinions.sql.
--
-- pg_cron   -> codziennie o 08:00 UTC (= 10:00 PL latem)
-- pg_net    -> HTTP GET na endpoint /api/cron/generate-summary
-- Vault     -> przechowuje URL + CRON_SECRET (ten sam sekret co opinie)
--
-- WYMAGANE PO MIGRACJI: wstaw sekret URL do Vault:
--   SELECT vault.create_secret('generate_summary_url', 'https://<twoja-domena>/api/cron/generate-summary', 'URL triggera podsumowań dnia');
--   (cron_secret jest już w Vault z migracji 0007)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS supabase_vault;

-- ------------------------------------------------------------
-- Funkcja wyzwalająca generowanie podsumowań
-- Czyta URL + sekret z Vault i robi autoryzowany HTTP GET.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trigger_generate_summary()
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
  WHERE name = 'generate_summary_url';

  SELECT decrypted_secret INTO v_secret
  FROM vault.decrypted_secrets
  WHERE name = 'cron_secret';

  IF v_url IS NULL OR v_secret IS NULL THEN
    RAISE WARNING 'trigger_generate_summary: brak sekretów w Vault (generate_summary_url / cron_secret)';
    RETURN;
  END IF;

  PERFORM net.http_get(
    url     => v_url,
    headers => jsonb_build_object('Authorization', 'Bearer ' || v_secret),
    -- generowanie podsumowań wymaga wywołań LLM + football API — dajemy duży zapas
    timeout_milliseconds => 120000
  );
END;
$$;

REVOKE ALL ON FUNCTION public.trigger_generate_summary() FROM PUBLIC;

-- ------------------------------------------------------------
-- Harmonogram: codziennie 08:00 UTC (= 10:00 czasu polskiego latem)
-- ------------------------------------------------------------
SELECT cron.schedule(
  'generate-summary-daily',
  '0 8 * * *',
  $$SELECT public.trigger_generate_summary();$$
);
