-- ============================================================
-- 0005_cron_sync_results.sql — Harmonogram synchronizacji wyników
-- Zastępuje crona Vercela (Hobby nie obsługuje godzinowych jobów).
--
-- Mechanizm:
--   pg_cron  -> co godzinę wywołuje funkcję trigger_sync_results()
--   pg_net   -> robi asynchroniczny HTTP GET na endpoint aplikacji
--   Vault    -> przechowuje URL endpointu i CRON_SECRET (bez sekretów w gicie)
--
-- WYMAGANE PO MIGRACJI: wstaw sekrety do Vault — patrz
--   supabase/cron_secrets.example.sql
-- ============================================================

-- ------------------------------------------------------------
-- Rozszerzenia
-- ------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS supabase_vault;

-- ------------------------------------------------------------
-- Funkcja wyzwalająca synchronizację
-- Czyta URL + sekret z Vault i robi autoryzowany HTTP GET.
-- SECURITY DEFINER: dostęp do vault.decrypted_secrets.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trigger_sync_results()
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
  WHERE name = 'sync_results_url';

  SELECT decrypted_secret INTO v_secret
  FROM vault.decrypted_secrets
  WHERE name = 'cron_secret';

  IF v_url IS NULL OR v_secret IS NULL THEN
    RAISE WARNING 'trigger_sync_results: brak sekretów w Vault (sync_results_url / cron_secret)';
    RETURN;
  END IF;

  PERFORM net.http_get(
    url     => v_url,
    headers => jsonb_build_object('Authorization', 'Bearer ' || v_secret),
    -- sync pobiera dane z zewnętrznego API i aktualizuje wiele meczów,
    -- więc dajemy zapas ponad domyślne 2000 ms
    timeout_milliseconds => 30000
  );
END;
$$;

-- Tylko rola postgres może wołać funkcję ręcznie / przez cron.
REVOKE ALL ON FUNCTION public.trigger_sync_results() FROM PUBLIC;

-- ------------------------------------------------------------
-- Harmonogram: co godzinę o pełnej godzinie (jak poprzednio na Vercelu)
-- cron.schedule jest idempotentne po nazwie joba.
-- ------------------------------------------------------------
SELECT cron.schedule(
  'sync-results-hourly',
  '0,45 21-23,0-6 * * *', -- co 45 min między 21:00 a 06:00 UTC (okno meczowe)
  $$SELECT public.trigger_sync_results();$$
);
