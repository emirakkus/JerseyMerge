ALTER TABLE users ADD COLUMN powerup_inventory jsonb NOT NULL DEFAULT '{"joker":1,"bomb":1,"scramble":1}'::jsonb;
