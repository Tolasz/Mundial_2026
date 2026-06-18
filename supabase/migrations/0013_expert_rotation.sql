-- Migration: Expert rotation & comments
-- Adds is_active flag to expert_opinions and daily_summaries,
-- and creates the expert_comments table for inter-expert reactions.

-- Add is_active to expert_opinions (existing rows stay visible by default)
ALTER TABLE expert_opinions
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- Add is_active to daily_summaries (existing rows stay visible by default)
ALTER TABLE daily_summaries
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- Create expert_comments table
CREATE TABLE IF NOT EXISTS expert_comments (
  id                     uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  post_type              text        NOT NULL CHECK (post_type IN ('opinion', 'summary')),
  post_persona           text        NOT NULL,
  commenter_persona      text        NOT NULL,
  commenter_display_name text        NOT NULL,
  stance                 text        CHECK (stance IN ('agree', 'disagree', 'roast')),
  body                   text        NOT NULL,
  generated_at           timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookup by post
CREATE INDEX IF NOT EXISTS expert_comments_post_idx
  ON expert_comments (post_type, post_persona);

-- RLS
ALTER TABLE expert_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "expert_comments_select_authenticated" ON expert_comments;
CREATE POLICY "expert_comments_select_authenticated"
  ON expert_comments FOR SELECT TO authenticated USING (true);
