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
  'https://mundial-2026-lemon.vercel.app/api/cron/sync-results',
  'sync_results_url',
  'URL endpointu synchronizacji wyników (pg_cron)'
);

-- CRON_SECRET (ta sama wartość co zmienna środowiskowa w aplikacji)
SELECT vault.create_secret(
  'adbhs78ofiqehsdopmadvnasy78f7dvas',
  'cron_secret',
  'Bearer token autoryzujący joba sync-results'
);

-- URL endpointu generowania opinii AI (podmień domenę)
SELECT vault.create_secret(
  'https://mundial-2026-lemon.vercel.app/api/cron/generate-opinions',
  'generate_opinions_url',
  'URL endpointu generowania opinii ekspertów (pg_cron)'
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
