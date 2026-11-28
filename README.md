# Susu Circle — Full-Stack Community Savings App

Susu Circle joins a React + Vite frontend (`client/`) and an Express + MongoDB
API (`server/`) into one repository that a real savings group can use to track
circles, members, and contributions.

> **Screenshot:** After connecting your MongoDB Atlas `MONGO_URI` and running
> `npm run seed`, save a screenshot of the running app to `docs/screenshot.png`
> and embed it here with `![Susu Circle App Screenshot](./docs/screenshot.png)`.

## Repository Structure

```text
susu-circle/
├── client/                 # React + Vite + React Router + Axios frontend
│   ├── src/
│   │   ├── api.js          # Axios instance (VITE_API_URL), JWT request + 401 response interceptors
│   │   ├── components/     # Header, ProtectedRoute, ErrorBoundary, CreateGroupForm, GroupList
│   │   ├── context/        # AuthContext, GroupsContext
│   │   ├── hooks/          # useAuth, useGroups
│   │   ├── pages/          # ExploreGroupsPage, MyGroupsPage, NewGroupPage, GroupDetailPage, AddContributionPage, LoginPage, NotFoundPage
│   │   └── state/          # Pure group validation & _id helpers
│   ├── test/               # Unit tests (Axios auth + 401 interceptor + group operations)
│   └── .env.example        # VITE_API_URL
├── server/                 # Express + Mongoose + JWT + bcrypt API
│   ├── config/db.js        # connectDB() before server starts
│   ├── controllers/        # asyncHandler controllers (auth, groups, members, contributions)
│   ├── middleware/         # requireAuth, checkOwner, findGroup, asyncHandler, validation, errors
│   ├── models/             # User, Group (owner + virtual memberCount), Member, Contribution
│   ├── routes/             # /auth, /groups (/mine above /:id), /members, /contributions
│   ├── seed.js             # Idempotent test-login & sample-circle seeder
│   ├── server.js           # CLIENT_URL CORS config, /health, connectDB() before listen
│   ├── test/               # API integration tests
│   └── .env.example        # PORT, CLIENT_URL, JWT_SECRET, MONGO_URI
├── docs/                   # App screenshot for README
├── vibe-coding-log.md      # AI-assisted development log
└── .gitignore              # Single root .gitignore keeping .env and node_modules out of Git
```

## Setup Steps (Run Locally from a Fresh Clone)

Requirements: **Node.js 20+**, **npm**, and a free **MongoDB Atlas** cluster.

### 1. Configure and start the server (`server/`)

```sh
cd server
cp .env.example .env
```

Edit `server/.env` and set your real MongoDB Atlas `MONGO_URI` and a strong
`JWT_SECRET`:

```env
PORT=3001
CLIENT_URL=http://localhost:5173
JWT_SECRET=replace-with-a-long-random-secret
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/susu-circle?retryWrites=true&w=majority
```

Install dependencies, optionally seed the test accounts, and start the server:

```sh
npm install
npm run seed
npm run dev
```

### 2. Configure and start the client (`client/`)

In a second terminal:

```sh
cd client
cp .env.example .env
```

Confirm `client/.env` points to your running server:

```env
VITE_API_URL=http://localhost:3001
```

Install dependencies and start Vite:

```sh
npm install
npm run dev
```

Open the Vite URL shown in your terminal (default `http://localhost:5173`).

## Test Login Accounts

After running `npm run seed` in `server/` (or register a brand-new account on
`/register`):

| Role | Email | Password | Owns |
| --- | --- | --- | --- |
| Primary test user | `demo@susu.test` | `susu1234` | **Market Women Circle** |
| Second test user (for `403` demo) | `kojo@susu.test` | `susu1234` | **School Friends Circle** |

## Pages & Routes

| Path | Protected? | What it does |
| --- | --- | --- |
| `/` | Public | All Circles with search, sort, page buttons, loading/error/empty states |
| `/login`, `/register` | Public | Sign in or create an account (`POST /auth/login`, `POST /auth/register`) |
| `/groups/:id` | Public (owner buttons only when logged in as owner) | Group Detail showing members, populated contribution payer names, server `totalSaved`, and owner-only Edit/Delete buttons |
| `/my-groups` | **`ProtectedRoute`** | Logged-in user's circles (`GET /groups/mine`) with sort, pagination, and loading/error/empty states |
| `/groups/new` | **`ProtectedRoute`** | Dedicated New Group page (`POST /groups`) |
| `/groups/:id/contributions/new` | **`ProtectedRoute`** | Dedicated Add Contribution page (`POST /contributions`) |

## Demo Script Walkthrough (2-Minute Recording)

1. Open `/` while logged out — show public circles, search, sort, and page buttons.
2. Click **My Groups** (`/my-groups`) while logged out — show `ProtectedRoute` redirecting to `/login`.
3. Log in with `demo@susu.test` / `susu1234` — show Axios sending the JWT token and landing on **My Groups**.
4. Open **New Group** (`/groups/new`) — create a new circle, confirm you are its owner with Edit/Delete buttons visible.
5. Add a member on **Group Detail**, then click **+ Add contribution** (`/groups/:id/contributions/new`) to record a contribution and see the server-calculated **Total saved** update.
6. Edit your circle, then open **School Friends Circle** (owned by `kojo@susu.test`) to show Edit/Delete buttons are hidden for non-owners (and backed by `403` on the API).
7. Click **Log out** in the header — token is cleared and protected pages redirect back to `/login`.

## Deployment (Render API + Vercel Frontend + MongoDB Atlas)

- **Live Frontend URL (Vercel):** `https://<your-vercel-app>.vercel.app` *(replace with your Vercel URL)*
- **Live API URL (Render):** `https://<your-render-service>.onrender.com` *(replace with your Render URL)*
- **Health endpoint:** `https://<your-render-service>.onrender.com/health` (returns HTTP `200` with `{ status: "ok", database: { status: "connected", name: "susu-prod" }, uptimeSeconds, timestamp }`, or `503` if MongoDB is disconnected — never exposes secrets)
- **GitHub repository:** https://github.com/SusanaSerwaaOseiPoku/susu-circle

### 1. Frontend Deployment on Vercel (`client/`)

| Setting | Value | Why |
| --- | --- | --- |
| **Root Directory** | `client` | Tells Vercel to build the React + Vite app inside `client/` |
| **Framework Preset** | `Vite` | Uses Vite's build pipeline |
| **Build Command** | `npm run build` | Produces the static bundle in `client/dist/` |
| **Output Directory** | `dist` | Serves the compiled Vite bundle |
| **Environment Variable** | `VITE_API_URL` = `https://<your-render-service>.onrender.com` | Points Axios to the live Render API with zero hardcoded URLs in code (redeploy after changing `VITE_*` variables because Vite bakes them in at build time) |

**SPA refresh routing (`client/vercel.json`):**
`client/vercel.json` rewrites every path (`/(.*)`) to `/index.html` so
refreshing `/my-groups`, `/groups/:id`, `/groups/new`, or
`/groups/:id/contributions/new` on Vercel loads React Router instead of a 404.

### 2. Preview Deployment from a Branch + CORS

1. Create a feature branch, make a small visible change, and push it to GitHub:
   ```sh
   git checkout -b preview-demo
   # make a small UI update and commit
   git push -u origin preview-demo
   ```
2. Vercel automatically builds a **Preview Deployment** URL (for example
   `https://susu-circle-git-preview-demo-<user>.vercel.app`).
3. On Render, update `CLIENT_URL` to allow both production and the preview URL
   (comma-separated, e.g.
   `https://<your-vercel-app>.vercel.app,https://<your-preview-url>.vercel.app`,
   or a scoped pattern like `https://susu-circle-*.vercel.app`).
4. Verify on the preview URL that login, My Groups, and creating a group work
   with zero CORS errors.

### 3. Render Web Service Settings (`server/`)

This repo also includes a [render.yaml](./render.yaml) Blueprint, or you can
configure these exact settings manually in the Render dashboard:

| Setting | Value | Why |
| --- | --- | --- |
| **Service Type** | Web Service | Runs our long-lived Express HTTP server |
| **Root Directory** | `server` | Points Render to the API subfolder inside this monorepo |
| **Runtime** | Node (`>=20.0.0`, from `server/package.json` `engines`) | Ensures Render runs the same Node 20+ version tested locally |
| **Build Command** | `npm install` | Installs Express, Mongoose, bcryptjs, jsonwebtoken, dotenv, and cors |
| **Start Command** | `npm start` | Runs `node server.js`, calling `connectDB()` before listening on `process.env.PORT` |
| **Health Check Path** | `/health` | Lets Render confirm both Express and MongoDB are up |

### Environment Variables on Render (Values Kept Off GitHub)

| Variable Name | Purpose | Production Value Guidance |
| --- | --- | --- |
| `NODE_ENV` | Runtime mode | `production` |
| `MONGO_URI` | Production Atlas connection string | Use a **separate production database name** `susu-prod` (e.g. `.../susu-prod?retryWrites=true&w=majority`) — separate from local `susu-dev` |
| `JWT_SECRET` | Signs & verifies JWT tokens | Generate a **brand-new** long random secret (`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`) — never reuse your local dev secret |
| `CLIENT_URL` | Allowed CORS frontend origin(s) | Your deployed frontend URL (or comma-separated origins) |

> Render injects `PORT` automatically—do not hardcode it. Never commit `server/.env` or `client/.env`.

### Seed Production Data Once (`susu-prod`)

Run the idempotent seeder once against your production `MONGO_URI` (in a local
shell with `MONGO_URI` pointing to `susu-prod`, or from Render's Shell tab):

```sh
cd server
npm run seed
```

This creates the test user (`demo@susu.test` / `susu1234`) and sample group
(**Market Women Circle**) in `susu-prod` and logs the seeded database name.

### Live API Verification in Thunder Client

Run these requests against `https://<your-render-service>.onrender.com`:

1. `GET /health` → `200`, `database.status: "connected"`, `database.name: "susu-prod"`
2. `POST /auth/register` with a new `{ name, email, password }` → `201`
3. `POST /auth/login` with `{ email, password }` → `200` + copy `token`
4. `POST /groups` (header `Authorization: Bearer <token>`) → `201` + copy `_id`
5. `POST /members` (Bearer token, `{ group, name }`) → `201` + copy `_id`
6. `POST /contributions` (Bearer token, `{ group, member, amount }`) → `201`
7. `GET /groups/<groupId>/contributions` → `200` with populated payer name and server `totalSaved`

### How to Roll Back

- **Frontend (Vercel):** Open the Vercel project → **Deployments** → find the
  last known-good production deployment → click `...` → **Instant Rollback**.
- **Backend (Render):** Open the Render service → **Events / Deploys** → pick
  the last working deploy → click **Rollback to this deploy**.
- **Code (Git):** Run `git revert <bad-commit-hash>` and push to `main` so both
  Vercel and Render auto-deploy the clean revert without rewriting history.

### Which Side to Check First When It Breaks

Follow this order from the server outward so you find the broken layer fast:

1. **Check the API first (`GET <live-api-url>/health`):**
   - Does not load or returns `503` → the problem is on **Render or MongoDB Atlas**.
     Check **Render Logs** for startup crashes, missing `MONGO_URI`/`JWT_SECRET`,
     or Atlas IP allowlist blocks.
   - Returns `200` with `database.status: "connected"` → the API and database are
     healthy; move to step 2.
2. **Check Browser DevTools → Network & Console on the Vercel site:**
   - **CORS error** (`Access-Control-Allow-Origin` blocked) → check `CLIENT_URL`
     on **Render** (must match the exact Vercel production or preview origin,
     with `https://` and no typo).
   - **Request goes to the wrong host or `undefined/...`** → check `VITE_API_URL`
     in **Vercel Environment Variables** and trigger a **redeploy** (Vite reads
     `VITE_*` variables at build time, not runtime).
   - **`404` on page refresh** → confirm `client/vercel.json` exists and Vercel
     **Root Directory** is set to `client`.
   - **`401` / `403` / `400` JSON response** → both services are talking fine;
     inspect the response body message (expired token, non-owner edit, or form
     validation).

### Week 18 Checklist (API Live on Render)

- [x] `PORT` from `process.env`, `start` script, and `engines` field in `server/package.json`
- [x] Repo on GitHub with no `.env` files tracked and `.env.example` listing every variable name
- [x] `/health` reports database status without exposing secrets
- [x] `seed.js` seeds test user + sample group and prints the target DB name
- [x] `render.yaml` & Deployment docs with Root Directory (`server`), Build Command, Start Command, and variable names
- [ ] Create Render Web Service with `MONGO_URI` (`susu-prod`) and a **new** `JWT_SECRET`
- [ ] Run `npm run seed` against `susu-prod`
- [ ] Update the Live API URL above, test the live URL in Thunder Client, and take screenshots of `/health` and Render logs (with secrets hidden)

### Week 19 Checklist (Frontend Live on Vercel, End to End)

- [x] Clean `npm run build` in `client/` and zero `localhost` references in `client/src/`
- [x] `client/vercel.json` added so refreshing any route works
- [x] `server/server.js` CORS accepts comma-separated production + Vercel preview URLs via `CLIENT_URL`
- [x] README updated with live URL slots, test login, rollback steps, and troubleshooting order
- [ ] Create Vercel project with **Root Directory: `client`**, Build Command `npm run build`, Output Directory `dist`, and `VITE_API_URL` set to the live Render API URL
- [ ] Set `CLIENT_URL` on Render to your live Vercel URL (plus your preview branch URL) and verify CORS
- [ ] Create at least one preview deployment from a branch and verify it against the live API
- [ ] Run the 6-step Week 17 demo on a phone using mobile data and record the 2-minute phone screen recording
- [ ] Add your live frontend/API links and screenshot (`docs/screenshot.png`) to this README

## Tests & Production Build

### Running the Server Test Suite (`vitest` + `supertest`)

```sh
cd server
npm test
```

The API test suite uses **Vitest** and **Supertest** against Express exported
from `server/app.js` (split cleanly from `server/server.js`, so Render's
`npm start` and `/health` stay unchanged).

- **Isolated `susu-test` database (`server/test/setup.js`):**
  - If `MONGO_URI_TEST` is set in `server/.env`, the suite refuses to start
    unless the database name ends in **`-test`** (e.g., `susu-test`), so real
    `susu-dev` or `susu-prod` data can never be touched.
  - If `MONGO_URI_TEST` is left as a placeholder locally, `setup.js` starts an
    isolated in-memory MongoDB server named `susu-test` automatically.
  - Every collection in `susu-test` is emptied in `afterEach`, keeping tests
    independent.
- **Shared auth helper (`server/test/helpers.js`):** Every authenticated test
  uses `getToken()` to register/log in and attach a Bearer token.

#### What the 20 Server Tests Cover

- **Pure unit tests (`server/test/contributions.unit.test.js` — 5 tests):**
  `calculateContributionTotal` edge cases (empty array, positive totals,
  floating-point decimals `10.1 + 20.2 = 30.3`, invalid/negative/non-array
  inputs) and `getCorsOptions` (production + Vercel preview URLs vs blocked
  origins).
- **Auth tests (`server/test/auth.test.js` — 5 tests):**
  `POST /auth/register` password hashing & token (`201`), repeated email
  rejection (`409`), `POST /auth/login` token (`200`), wrong password / unknown
  email (`401`), and `GET /auth/me` (`200` without secrets / `401` unauth).
- **Groups, members, contributions & failure tests (`server/test/groups-contributions.test.js` — 10 tests):**
  `GET /health` connected DB status, `POST /groups` with owner link, public
  `GET /groups` populate/search/sort/pagination, `GET /groups/mine` (`200`/`401`),
  creating members & contributions with populated payer names and server
  `totalSaved`, plus failure paths: unauthenticated writes (`401`), validation
  errors (`400`), non-owner `PATCH`/`DELETE` (`403`), invalid ObjectId (`400`),
  and missing group ObjectId (`404`).

### Running Client Tests & Production Build

```sh
cd client
npm test
npm run build
```
