-- ============================================================
-- 0010_cron_sync_morning.sql — Dodatkowy sync wyników rano
--
-- Uruchamia synchronizację o 07:00 UTC = 09:00 CEST (czas letni PL).
-- Uzupełnia nocne okno meczowe (0005) o poranny odczyt wyników —
-- przydatne gdy cron nocny nie zdążył pobrać ostatecznych danych
-- lub generate-summary odpala się wcześnie.
-- ============================================================

SELECT cron.schedule(
  'sync-results-morning',
  '0 7 * * *',  -- 07:00 UTC = 09:00 CEST
  $$SELECT public.trigger_sync_results();$$
);
