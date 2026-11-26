# Susu Circle React App

React + Vite frontend for the Susu Circle savings tracker, connected to the
MongoDB-backed `susu-circle-api` over Axios with JWT auth, **My Groups**,
search/sort/pagination buttons, and a dedicated **Group page** showing linked
members and contributions.

## Features

- **All Circles** (`GET /groups`): displays owner email and member count on
  every group card, with search by name, sort dropdown, and **page buttons**
  (`Previous`, numbered pages, `Next`).
- **My Groups page** (`GET /groups/mine`): protected view showing only circles
  owned by the logged-in user, with a form to create new circles.
- **Group page** (`GET /groups/:id/members` & `GET /groups/:id/contributions`):
  displays populated member names, server-calculated **Total saved**, owner
  edit/delete controls (`403` for non-owners), member management, and
  contribution recording.
- **Login / Register & Logout**: attaches `Authorization: Bearer <token>` via
  an Axios request interceptor (`src/api.js`) and clears it on logout.

## Run locally

```sh
npm install
npm run dev
```

## Test and build

```sh
npm test
npm run build
```
