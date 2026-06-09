-- ============================================================
-- cron_secrets.example.sql — Sekrety dla joba sync-results (Vault)
--
-- NIE jest to migracja. Uruchom RĘCZNIE w Supabase Dashboard ->
-- SQL Editor (osobno dla każdego środowiska), po podmianie wartości.
-- Sekrety trzymamy w Vault, żeby NIE trafiły do repozytorium.
--
-- Wartości:
--   sync_results_url -> publiczny URL endpointu aplikacji na Vercelu
--   cron_secret      -> taka sama wartość jak env CRON_SECRET w aplikacji
-- ============================================================

-- URL endpointu (podmień domenę na swój deployment produkcyjny)
SELECT vault.create_secret(
  'https://TWOJA-DOMENA.vercel.app/api/cron/sync-results',
  'sync_results_url',
  'URL endpointu synchronizacji wyników (pg_cron)'
);

-- CRON_SECRET (ta sama wartość co zmienna środowiskowa w aplikacji)
SELECT vault.create_secret(
  'WKLEJ_TUTAJ_CRON_SECRET',
  'cron_secret',
  'Bearer token autoryzujący joba sync-results'
);

-- ------------------------------------------------------------
-- Aktualizacja istniejącego sekretu (gdy zmienisz URL/secret):
--   UPDATE vault.secrets
--   SET secret = 'nowa-wartosc'
--   WHERE name = 'sync_results_url';
--
-- Ręczne uruchomienie joba (test):
--   SELECT public.trigger_sync_results();
--
-- Podgląd odpowiedzi (pg_net trzyma je 6 h):
--   SELECT * FROM net._http_response ORDER BY created DESC LIMIT 5;
--
-- Historia uruchomień crona:
--   SELECT * FROM cron.job_run_details
--   WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'sync-results-hourly')
--   ORDER BY start_time DESC LIMIT 10;
-- ------------------------------------------------------------
