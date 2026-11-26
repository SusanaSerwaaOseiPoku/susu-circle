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

## Deployment (Render + MongoDB Atlas)

- **Live API URL:** `https://<your-render-service>.onrender.com` *(replace with your Render URL after creating the Web Service)*
- **Health endpoint:** `https://<your-render-service>.onrender.com/health` (returns HTTP `200` with `{ status: "ok", database: { status: "connected", name: "susu-prod" }, uptimeSeconds, timestamp }`, or `503` if MongoDB is disconnected — never exposes secrets)
- **GitHub repository:** https://github.com/SusanaSerwaaOseiPoku/susu-circle

### Render Web Service Settings

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

### Deployment Checklist

- [x] `PORT` from `process.env`, `start` script, and `engines` field in `server/package.json`
- [x] Repo on GitHub with no `.env` files tracked and `.env.example` listing every variable name
- [x] `/health` reports database status without exposing secrets
- [x] `seed.js` seeds test user + sample group and prints the target DB name
- [x] `render.yaml` & Deployment docs with Root Directory (`server`), Build Command, Start Command, and variable names
- [ ] Create Render Web Service with `MONGO_URI` (`susu-prod`) and a **new** `JWT_SECRET`
- [ ] Run `npm run seed` against `susu-prod`
- [ ] Update the Live API URL above, test the live URL in Thunder Client, and take screenshots of `/health` and Render logs (with secrets hidden)

## Tests & Production Build

```sh
# Server tests
cd server && npm test

# Client tests & build
cd client && npm test && npm run build
```
