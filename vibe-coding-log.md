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

---

## Live Deployment Prep (Render & Production Database `susu-prod`)

### What AI helped create or change

- Added `"engines": { "node": ">=20.0.0" }` to `server/package.json` alongside `"start": "node server.js"` and `process.env.PORT`.
- Upgraded `GET /health` in `server/server.js` to report live Mongoose connection status (`database.status` and `database.name`), uptime, and timestamp (`200` when connected, `503` when disconnected) without leaking any secrets or URIs.
- Updated `server/.env.example` to document every variable name (`PORT`, `NODE_ENV`, `CLIENT_URL`, `JWT_SECRET`, `MONGO_URI`) and explain keeping dev (`susu-dev`) and production (`susu-prod`) databases separate with a new production `JWT_SECRET`.
- Updated `server/seed.js` to log the seeded database name (`mongoose.connection.name`) so production seeding into `susu-prod` can be confirmed cleanly.
- Added `render.yaml` (`rootDir: server`, `buildCommand: npm install`, `startCommand: npm start`, `healthCheckPath: /health`) and a complete **Deployment** section in `README.md` with the Render settings table, environment variable table, Thunder Client test flow, and deployment checklist.
- Expanded `server/test/api.test.js` to test `package.json` `start`/`engines` and both `200` (connected) and `503` (disconnected) `/health` responses.

### What was checked during development

- `server`: `npm test` — verified `start` script, `engines.node`, `GET /health` database status reporting (`503` disconnected / `200` connected) with zero secrets, CORS `CLIENT_URL`, and all auth/group/member/contribution routes.
- Verified with `git check-ignore` and `git ls-files` that no `.env` file is tracked in GitHub.

### What I still need to check myself

- Create the Render Web Service linked to `SusanaSerwaaOseiPoku/susu-circle` with Root Directory `server`, Build Command `npm install`, Start Command `npm start`, Health Check Path `/health`, `NODE_ENV=production`, `MONGO_URI` pointing to `/susu-prod`, a brand-new production `JWT_SECRET`, and `CLIENT_URL`.
- Allow Render's outbound IPs (or `0.0.0.0/0`) in MongoDB Atlas Network Access so Render can connect to `susu-prod`.
- Seed `susu-prod` once with `npm run seed`, verify `GET <live-url>/health` shows `connected` + `susu-prod`, and run the register/login/create-group/add-contribution flow in Thunder Client against the live Render URL.
- Paste my live Render URL into `README.md` and capture screenshots of `/health` and Render logs (hiding all secrets).

---

## Week 19 — Live, End to End (Vercel Frontend + Render API)

### What AI helped create or change

- Added `client/vercel.json` with SPA rewrites (`/(.*) -> /index.html`) so refreshing any React Router route on Vercel never returns 404.
- Enhanced `getCorsOptions` in `server/server.js` to normalize trailing slashes and accept comma-separated production + Vercel preview origins (including scoped wildcard patterns like `https://susu-circle-*.vercel.app`) from `CLIENT_URL`, with zero hardcoded URLs.
- Updated `client/.env.example` and `server/.env.example` with Vercel/Render production and preview URL guidance.
- Expanded `server/test/api.test.js` to verify CORS allows production Vercel origins and preview branch origins while blocking unrelated origins.
- Updated `README.md` with Vercel deployment settings (`Root Directory: client`), preview-branch CORS workflow, **How to Roll Back**, **Which Side to Check First When It Breaks**, and both the **Week 18** and **Week 19** checklists.

### What was checked during development

- `client`: `npm test` (8/8 passing) and `npm run build` (clean Vite build).
- Audited `client/src/` and `server/` source files to confirm zero `localhost` or hardcoded `http://` URLs.
- `server`: `npm test` (4/4 passing, including production + preview CORS checks).

### What I still need to check myself

- Create the Vercel project with Root Directory `client`, Build Command `npm run build`, Output Directory `dist`, and `VITE_API_URL` pointing to my live Render API.
- Set `CLIENT_URL` on Render to my Vercel production URL and my preview branch URL, then verify CORS works on both.
- Push a branch for at least one Vercel Preview Deployment and confirm login + API requests succeed on it.
- Run the full 6-step Week 17 demo on my phone over mobile data, record the 2-minute screen recording, and paste my live Vercel + Render URLs and app screenshot into `README.md`.
