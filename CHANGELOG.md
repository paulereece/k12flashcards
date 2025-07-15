# CHANGELOG

## 2024-07-15: Migration & Debugging Session

- **Issue:** Study sessions were not logging `time_seconds` due to missing column in Neon database, causing 500 errors on POST `/api/study-sessions`.
- **Actions Taken:**
  - Verified migration files and schema.
  - Confirmed `dbmate.env` and backend were using the same `DATABASE_URL`.
  - Removed trailing space from `dbmate.env` to avoid connection issues.
  - Ran migrations multiple times; discovered `schema_migrations` table showed migrations as applied, but schema was not updated.
  - Manually reset `schema_migrations` table (deleted all entries) without dropping tables/data.
  - Re-ran all migrations with `npx dbmate up`.
  - Confirmed `time_seconds` column appeared in `study_sessions` table.
  - Successfully tested study session logging; 500 error resolved.
- **Lessons Learned:**
  - Always verify the actual schema after running migrations, not just the migration log.
  - Trailing spaces in environment files can cause subtle issues.
  - Resetting `schema_migrations` and re-running migrations can resolve schema drift without data loss.

## Ongoing Best Practices
- Use `ProjectSummary.md` for high-level architecture, workflow, and philosophy.
- Use `CHANGELOG.md` for detailed, chronological records of changes, troubleshooting, and fixes.
- Always check both migration logs and actual schema after running migrations.
- Keep migrations additive and non-destructive to support live database updates. 