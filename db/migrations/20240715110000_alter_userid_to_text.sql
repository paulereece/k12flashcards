-- migrate:up

-- Drop foreign key constraints
ALTER TABLE classes DROP CONSTRAINT IF EXISTS classes_teacher_id_fkey;
ALTER TABLE decks DROP CONSTRAINT IF EXISTS decks_teacher_id_fkey;

-- Alter columns from UUID to TEXT
ALTER TABLE users ALTER COLUMN id TYPE TEXT;
ALTER TABLE classes ALTER COLUMN teacher_id TYPE TEXT;
ALTER TABLE decks ALTER COLUMN teacher_id TYPE TEXT;

-- Recreate foreign key constraints
ALTER TABLE classes ADD CONSTRAINT classes_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE decks ADD CONSTRAINT decks_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE;

-- migrate:down

-- Drop new constraints
ALTER TABLE classes DROP CONSTRAINT IF EXISTS classes_teacher_id_fkey;
ALTER TABLE decks DROP CONSTRAINT IF EXISTS decks_teacher_id_fkey;

-- Revert columns to UUID (will fail if data is not UUIDs)
ALTER TABLE users ALTER COLUMN id TYPE UUID USING id::uuid;
ALTER TABLE classes ALTER COLUMN teacher_id TYPE UUID USING teacher_id::uuid;
ALTER TABLE decks ALTER COLUMN teacher_id TYPE UUID USING teacher_id::uuid;

-- Recreate original constraints
ALTER TABLE classes ADD CONSTRAINT classes_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE decks ADD CONSTRAINT decks_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE; 