-- ============================================================
-- 0012_cron_summary_08_pl.sql — Zmiana harmonogramu generowania podsumowań dnia
--
-- Poprzedni harmonogram: 08:00 UTC (= 10:00 PL latem)
-- Nowy harmonogram:      06:00 UTC (= 08:00 PL latem / CEST)
-- ============================================================

SELECT cron.unschedule('generate-summary-daily');

SELECT cron.schedule(
  'generate-summary-daily',
  '0 6 * * *',  -- 06:00 UTC = 08:00 CEST (czas letni PL)
  $$SELECT public.trigger_generate_summary();$$
);
