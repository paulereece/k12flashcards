-- migrate:up

ALTER TABLE users ALTER COLUMN password DROP NOT NULL;
-- Add time_seconds column to study_sessions if not exists
ALTER TABLE study_sessions ADD COLUMN IF NOT EXISTS time_seconds integer;

-- migrate:down

ALTER TABLE users ALTER COLUMN password SET NOT NULL; 