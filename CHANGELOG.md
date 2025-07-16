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

## 2025-07-15: Render Deployment Troubleshooting & Resolution

- **Issue:** Render deployments were failing or not reflecting code changes. Student side worked locally but not in production. Errors included environment variable issues and build failures.
- **Root Causes & Discoveries:**
  - Render was set to deploy from the `main` branch, but all active development was on `master`. This meant new code and fixes were not being deployed.
  - The backend was always loading `dbmate.env` (local dev file) even in production, instead of using Render's environment variables.
  - The `dbmate.env` file was tracked by git and deployed to production, causing further confusion.
  - After switching Render to deploy from `master`, a new build error appeared: a Rollup native module could not be found due to a known npm bug with optional dependencies.
- **Actions Taken:**
  - Confirmed branch confusion by comparing local, remote, and GitHub branches/commits.
  - Updated Render service to deploy from `master` branch.
  - Added `dbmate.env` to `.gitignore` and removed it from the repo so it is only used locally.
  - Updated `server.js` to only load `dbmate.env` in local development (not in production), using `NODE_ENV`.
  - Deleted `node_modules` and `package-lock.json`, then reinstalled dependencies and committed the new lockfile to resolve the Rollup/npm build error.
  - Successfully deployed the latest code to Render and confirmed the student side works in production.
- **Lessons Learned:**
  - Always verify which branch your deployment service is using, especially after migrations or repo changes.
  - Use environment variables for production, and only load local `.env` files in development.
  - Regenerating `package-lock.json` and reinstalling dependencies can resolve tricky npm build errors.
  - Step-by-step troubleshooting and careful verification of each environment is key to resolving deployment issues.

## Ongoing Best Practices
- Use `ProjectSummary.md` for high-level architecture, workflow, and philosophy.
- Use `CHANGELOG.md` for detailed, chronological records of changes, troubleshooting, and fixes.
- Always check both migration logs and actual schema after running migrations.
- Keep migrations additive and non-destructive to support live database updates. 