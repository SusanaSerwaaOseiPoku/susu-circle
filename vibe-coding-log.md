# Vibe Coding Log — Susu Circle: The First Full Version

This log records AI-assisted work combining the Susu Circle React frontend and Express/MongoDB API into one full-stack repository. Review every item and add your own demo recording notes before submitting.

## What AI helped create or change

- Combined the Week 16 React app and Express/Mongoose API into a single repository (`susu-circle/`) with `client/` and `server/` folders, one root `.gitignore`, `client/.env.example` (`VITE_API_URL`), and `server/.env.example` (`CLIENT_URL`, `PORT`, `JWT_SECRET`, `MONGO_URI`).
- Removed hardcoded server/client URLs from application source code:
  - `client/src/api.js` reads `import.meta.env.VITE_API_URL`.
  - `server/server.js` configures CORS strictly from `process.env.CLIENT_URL` and adds `GET /health`.
- Added an Axios **401 response interceptor** (`handleResponseError` + `onUnauthorized`) in `client/src/api.js` wired into `AuthContext.jsx` so expired/invalid sessions automatically clear the token and prompt re-login (without swallowing normal 401 login-form errors).
- Installed `react-router-dom` and built dedicated pages:
  - `ExploreGroupsPage` (`/`): public circles with search, sort, page buttons, and loading/error/empty states.
  - `MyGroupsPage` (`/my-groups`, wrapped in `ProtectedRoute`): calls `GET /groups/mine` with loading/error/empty states and page buttons.
  - `NewGroupPage` (`/groups/new`, wrapped in `ProtectedRoute`): creates a new group (`POST /groups`).
  - `GroupDetailPage` (`/groups/:id`): displays members, populated contribution payer names, server `totalSaved`, and **owner-only** Edit/Delete buttons backed by server `checkOwner` (`403`).
  - `AddContributionPage` (`/groups/:id/contributions/new`, wrapped in `ProtectedRoute`): records a new contribution (`POST /contributions`).
  - `LoginPage` (`/login`, `/register`) and `NotFoundPage` (`*`) plus a top-level `ErrorBoundary` so screens never go blank.
- Added `server/seed.js` (`npm run seed`) creating test login accounts (`demo@susu.test` / `susu1234` and `kojo@susu.test` / `susu1234`) with hashed passwords and sample linked circles.
- Added unit tests for the 401 response interceptor (`client/test/authApi.test.js`), CORS `CLIENT_URL` & `/health` tests (`server/test/api.test.js`), and a full root `README.md` with setup steps, test login, and demo walkthrough.

## What was checked during development

- `server`: `npm test` — verified `connectDB`, `CLIENT_URL` CORS allow/block behavior, `/health`, model refs & `memberCount` virtual, `GET /groups` populate/search/sort/pagination, `GET /groups/mine` above `/:id`, `checkOwner` `403`, and `GET /groups/:id/contributions` populated member names + server `totalSaved`.
- `client`: `npm test` (Axios Bearer attachment, 401 response interceptor, MongoDB `_id` group operations, `useGroups` guard) and `npm run build` (Vite production build).
- Audited `client/src/` and `server/` to confirm zero hardcoded `http://` or `localhost` URLs in application source files.
- Verified root `.gitignore` ignores both `server/.env` and `client/.env` while tracking both `.env.example` files.

## What I still need to check myself

- Paste my real MongoDB Atlas `MONGO_URI` into `server/.env`, run `npm run seed` and `npm run dev` in `server/`, and `npm run dev` in `client/`.
- Walk through the full 2-minute demo script (public browse → ProtectedRoute redirect → login → My Groups → New Group → add member → Add Contribution → owner Edit/Delete vs non-owner hidden buttons/403 → logout) and record my 2-minute screen recording.
- Capture/replace `docs/screenshot.png` with a screenshot of my live seeded circles if I want my own Atlas data shown in the README screenshot.
- Review every file in `client/` and `server/` so I can explain any file during class Q&A.
