-- ============================================================
-- Jersey Merge — PostgreSQL kurulum betiği
-- Bu dosya src/db/schema.ts ile birebir uyumludur.
-- Uygulama:  psql "$DATABASE_URL" -f db/setup.sql
-- Tekrar çalıştırılabilir (IF NOT EXISTS / ADD COLUMN IF NOT EXISTS).
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  id serial PRIMARY KEY,
  username text NOT NULL,
  email text UNIQUE,
  provider text NOT NULL DEFAULT 'password',
  avatar_url text,
  password_hash text NOT NULL,
  best_score integer NOT NULL DEFAULT 0,
  best_time_ms integer NOT NULL DEFAULT 0,
  best_at timestamptz NOT NULL DEFAULT now(),
  last_active_day text,
  streak integer NOT NULL DEFAULT 0,
  powerup_inventory jsonb NOT NULL DEFAULT '{"joker":1,"bomb":1,"scramble":1}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS users_username_idx ON users (username);

-- Eski kurulumlarda eklenmemiş olabilir:
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active_day text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS streak integer NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS powerup_inventory jsonb NOT NULL DEFAULT '{"joker":1,"bomb":1,"scramble":1}'::jsonb;

CREATE TABLE IF NOT EXISTS sessions (
  token text PRIMARY KEY,
  user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS scores (
  id serial PRIMARY KEY,
  user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score integer NOT NULL,
  time_ms integer NOT NULL DEFAULT 0,
  powerups_used integer NOT NULL DEFAULT 0,
  best_combo integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS scores_user_score_idx ON scores (user_id, score);
ALTER TABLE scores ADD COLUMN IF NOT EXISTS powerups_used integer NOT NULL DEFAULT 0;
ALTER TABLE scores ADD COLUMN IF NOT EXISTS best_combo integer NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS user_badges (
  user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id text NOT NULL,
  earned_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, badge_id)
);

CREATE TABLE IF NOT EXISTS player_progress (
  id serial PRIMARY KEY,
  user_id integer NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  xp integer NOT NULL DEFAULT 0,
  counters jsonb NOT NULL DEFAULT '{}'::jsonb,
  achievements text[] NOT NULL DEFAULT '{}',
  field_theme_id text NOT NULL DEFAULT 'classic',
  unlocked_field_themes text[] NOT NULL DEFAULT ARRAY['classic']::text[],
  seen_field_themes text[] NOT NULL DEFAULT ARRAY['classic']::text[],
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE player_progress ADD COLUMN IF NOT EXISTS field_theme_id text NOT NULL DEFAULT 'classic';
ALTER TABLE player_progress ADD COLUMN IF NOT EXISTS unlocked_field_themes text[] NOT NULL DEFAULT ARRAY['classic']::text[];
ALTER TABLE player_progress ADD COLUMN IF NOT EXISTS seen_field_themes text[] NOT NULL DEFAULT ARRAY['classic']::text[];

CREATE TABLE IF NOT EXISTS daily_scores (
  id serial PRIMARY KEY,
  user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day_key text NOT NULL,
  score integer NOT NULL,
  time_ms integer NOT NULL DEFAULT 0,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT daily_scores_user_day_key UNIQUE (user_id, day_key)
);

CREATE TABLE IF NOT EXISTS daily_quest_claims (
  user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day_key text NOT NULL,
  quest_id text NOT NULL,
  claimed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, day_key, quest_id)
);
