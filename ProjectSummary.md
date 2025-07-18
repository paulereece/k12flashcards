# Project Summary

## Overview
K12 Flashcards is a web application for teachers and students to manage, assign, and study flashcards. The project is currently migrating from Supabase (for database and authentication) to Neon (Postgres database) and Auth0 (authentication).

### Authentication Philosophy
- The system supports two types of users: teachers (who use Auth0 for secure login) and students (who use teacher-managed accounts, not Auth0).
- Teachers must be able to create, update, and delete student accounts directly, as is standard in K-12 environments.
- Google Classroom/Google login integration may be added in the future, but teacher-managed student accounts will always be supported for schools that do not use Google.

## Tech Stack
- **Frontend:** React (TypeScript, Vite)
- **Backend/API:** Node.js (Express server, custom API endpoints in `/api` and `server.js`)
- **Database:** Neon (Postgres, managed via SQL migrations)
- **Authentication:** Auth0 (in progress, replacing Supabase Auth)
- **Deployment:** Vercel (API endpoints in `/api` for serverless functions)

## Current Architecture
- **Frontend**: Uses React Router for navigation. Auth0 is integrated via `@auth0/auth0-react` in `App.tsx` and `TeacherLayout.tsx` for login/logout and route protection. Student login is still being migrated.
- **Backend**: Two approaches:
  - `server.js` runs a local Express server for development, handling API routes and connecting to Neon via the `pg` library.
  - `/api` directory contains Vercel serverless functions (e.g., `add-student.ts`, `create-class.ts`) for deployment.
- **Database**: Schema is defined in `db/schema.sql` and migrations in `db/migrations/`. Tables include users, classes, students, decks, cards, assignments, and study_sessions.

## Migration Status
- **Supabase**: All direct Supabase code is commented out or removed. Some references remain as TODOs.
- **Neon**: All new data operations (class, student, etc.) use Neon/Postgres via the `pg` library.
- **Auth0**: Teacher authentication is partially integrated (see `App.tsx`, `TeacherLayout.tsx`). Student authentication is not yet migrated; login is still a placeholder.
- **API**: Some endpoints are duplicated (in both `server.js` and `/api/` for Vercel). Both use Neon/Postgres.
- **Frontend**: Many TODOs remain for fetching data from Neon/Postgres and for integrating Auth0 for all user types.

## Troubleshooting & History
- Migration from Supabase to Neon required updating all database queries to use the `pg` library and Postgres SQL.
- Auth0 integration is ongoing. Teacher login/logout works, but student login and password reset are not yet implemented.
- Some endpoints and logic are duplicated between `server.js` (local dev) and `/api/` (Vercel deploy). This may cause confusion.
- The database schema is stable and managed via SQL migrations.
- No major errors currently, but some features are incomplete (e.g., assignment logic, CSV import, full Auth0 integration).
- The user has a zipped copy of the old Supabase version of the project, which can be referenced to restore or replicate features (such as deck functionality) as needed during migration.

## Local Development & Workflow Plan
- For local development, run both the Vite frontend (localhost:5173) and the Express backend (server.js, typically on localhost:3001).
- All API endpoints should be defined in server.js. The frontend should make API calls to http://localhost:3001/api/...
- Avoid duplicating API logic between server.js and the /api directory. Use server.js as the single source of truth for API endpoints during local development.
  - When adding new API endpoints, always add them to server.js (not /api/) for local development. This keeps the workflow simple and avoids confusion. If/when deploying to Vercel, endpoints can be migrated to /api as needed, but server.js remains the main backend for local dev.
- This approach allows for fast iteration without needing to push to git or deploy to Vercel for every change.
- When deploying to Vercel, you MUST migrate/copy all backend endpoints you need to the /api directory as serverless functions. Endpoints in server.js are NOT used in production on Vercel. If an endpoint is only in server.js, it will NOT be available after deployment. Always ensure all required API logic is present in /api before launching to production. This avoids confusion and ensures your app works as expected after launch.
- If you encounter 404 errors for API endpoints, check that the endpoint exists in server.js and that the backend server is running.

## Vite Proxy Setup for Local Development
- The Vite dev server is configured to proxy all /api requests to the Express backend at http://localhost:3001.
- This means you can use fetch('/api/...') in your frontend code, and it will automatically reach the backend during local development.
- No need to hardcode API URLs or worry about CORS/404 errors.
- This is the industry standard for modern web development and matches real team workflows.
- See vite.config.ts for the proxy configuration.

## User Notes & Questions
- [Add your own notes, questions, or reminders here.]
- If you encounter issues with login or data, check if you are running the correct backend (local server or Vercel API).
- For future troubleshooting, add a summary of the problem and what was tried here. 

## Migration & Debugging Session Summary (2024-07-15)

- Restored a working local development workflow (Vite frontend, Express backend, Neon/Postgres DB, Auth0 auth).
- Fixed backend to always use the correct Neon/Postgres DATABASE_URL from dbmate.env.
- Migrated all user IDs and foreign keys from UUID to TEXT for Auth0/Google compatibility.
- Implemented automatic user creation in the users table on first Auth0 login.
- Made the password field in users nullable for OAuth users (best practice).
- Added/updated backend endpoints for:
  - Creating, listing, and deleting decks
  - Fetching, adding, editing, and deleting cards
  - Updating deck names
  - Fetching a single deck by ID
  - Fetching all cards for a deck (GET /api/decks/:deckId/cards)
- Rebuilt the Edit Deck page with a modern, styled UI and full Neon/Postgres integration:
  - Fetches deck name and cards
  - Add, edit, delete cards
  - Rename deck
  - CSV upload for bulk card add (with working file picker)
- Implemented deck deletion from Teacher Home with confirmation and UI update.
- Added robust error handling, loading indicators, and user feedback throughout the app.
- Provided guidance on server restarts and workflow best practices. 

## Chat & Development Session Summary (2024-07-15)

- Refactored and modernized StudyView (student practice) UI for a clean, professional look.
- Restored advanced study logic: cards are shuffled, require 3 consecutive correct answers to complete, missed cards are prioritized, and the same card is not shown twice in a row. Session ends when all cards are complete.
- Added a subtle “X/Y cards completed” tracker in the lower right of StudyView.
- Added a faint, elegant back arrow in the top left of StudyView, which now securely routes teachers to their dashboard and students to theirs.
- Ensured keyboard navigation: Enter submits answers and advances cards.
- Fixed bugs where the input would disappear or the UI would get stuck.
- Confirmed that the “Assign” button in TeacherHome currently only opens a modal and does not perform any backend logic yet.
- Clarified and documented in ProjectSummary.md that all production endpoints must be present in /api/ for Vercel deployment—server.js is not used in production.
- Added a section to ProjectSummary.md documenting the authentication philosophy: teachers use Auth0, students use teacher-managed accounts, and Google Classroom integration may be added in the future but is not required.
- Ensured navigation and UX are professional and user-friendly, with dashboard routing based on user type. 