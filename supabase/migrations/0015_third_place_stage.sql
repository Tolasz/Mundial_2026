-- 0015_third_place_stage.sql
-- Dodaje fazę meczu o trzecie miejsce do enuma match_stage.
-- Wartość umieszczona przed 'final', aby zachować naturalną kolejność drabinki.

ALTER TYPE match_stage ADD VALUE IF NOT EXISTS 'third' BEFORE 'final';
