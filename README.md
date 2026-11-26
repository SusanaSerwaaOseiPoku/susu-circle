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

## Tests & Production Build

```sh
# Server tests
cd server && npm test

# Client tests & build
cd client && npm test && npm run build
```
