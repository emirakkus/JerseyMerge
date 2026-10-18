-- Jersey Merge saha temaları için tekrar çalıştırılabilir Neon/PostgreSQL geçişi.
ALTER TABLE player_progress
  ADD COLUMN IF NOT EXISTS field_theme_id text NOT NULL DEFAULT 'classic';

ALTER TABLE player_progress
  ADD COLUMN IF NOT EXISTS unlocked_field_themes text[] NOT NULL DEFAULT ARRAY['classic']::text[];

ALTER TABLE player_progress
  ADD COLUMN IF NOT EXISTS seen_field_themes text[] NOT NULL DEFAULT ARRAY['classic']::text[];
