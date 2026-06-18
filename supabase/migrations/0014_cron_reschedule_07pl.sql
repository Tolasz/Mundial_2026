-- ============================================================
-- 0014_cron_reschedule_07pl.sql — Reschedule wszystkich cronów na 07:00 czasu polskiego
--
-- 07:00 CEST (UTC+2, czas letni PL) = 05:00 UTC
-- Nowa kolejność:
--   04:59 UTC — snapshot-leaderboard-morning (zapis stanu "przed dniem")
--   05:00 UTC — sync-results-morning (synchronizacja wyników)
--   05:02 UTC — snapshot-leaderboard-daily (zapis stanu "po syncronizacji")
--   05:05 UTC — generate-opinions-daily (opinie ekspertów)
--   05:10 UTC — generate-summary-daily (podsumowanie dnia)
--
-- Cron nocturn sync-results-hourly pozostaje bez zmian (okno meczowe).
-- ============================================================

-- Snapshot "przed dniem" — 04:59 UTC (1 min przed syncem)
SELECT cron.unschedule('snapshot-leaderboard-morning');
SELECT cron.schedule(
  'snapshot-leaderboard-morning',
  '59 4 * * *',  -- 04:59 UTC = 06:59 CEST (tuż przed syncem)
  $$SELECT public.take_leaderboard_snapshot(CURRENT_DATE - 1);$$
);

-- Sync wyników rannych — 05:00 UTC (07:00 CEST)
SELECT cron.unschedule('sync-results-morning');
SELECT cron.schedule(
  'sync-results-morning',
  '0 5 * * *',   -- 05:00 UTC = 07:00 CEST
  $$SELECT public.trigger_sync_results();$$
);

-- Snapshot "po syncronizacji" — 05:02 UTC
SELECT cron.unschedule('snapshot-leaderboard-daily');
SELECT cron.schedule(
  'snapshot-leaderboard-daily',
  '2 5 * * *',   -- 05:02 UTC = 07:02 CEST (po syncronizacji wyników)
  $$SELECT public.take_leaderboard_snapshot();$$
);

-- Generowanie opinii ekspertów — 05:05 UTC (07:05 CEST)
SELECT cron.unschedule('generate-opinions-daily');
SELECT cron.schedule(
  'generate-opinions-daily',
  '5 5 * * *',   -- 05:05 UTC = 07:05 CEST
  $$SELECT public.trigger_generate_opinions();$$
);

-- Generowanie podsumowań dnia — 05:10 UTC (07:10 CEST)
SELECT cron.unschedule('generate-summary-daily');
SELECT cron.schedule(
  'generate-summary-daily',
  '10 5 * * *',  -- 05:10 UTC = 07:10 CEST
  $$SELECT public.trigger_generate_summary();$$
);
