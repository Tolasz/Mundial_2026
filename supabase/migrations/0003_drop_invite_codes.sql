-- 0003_drop_invite_codes.sql
-- Rejestracja otwarta (email/hasło) — usunięcie funkcjonalności kodu zaproszenia.
-- Tabela invite_codes nie jest już używana przez aplikację.

DROP TABLE IF EXISTS public.invite_codes CASCADE;
