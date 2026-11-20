# Susu Circle - Server data

This React app reads groups, members, and contributions from `db.json` through
json-server. Changes made in the app are sent to the server and saved in that
file.

## Start the server and app

1. Open a terminal in `contexts-and-hooks/`.
2. Install the project packages:

   ```sh
   npm ci
   ```

3. Start json-server in the first terminal:

   ```sh
   npm run server
   ```

   The API runs at `http://localhost:3001`.

4. Start the React app in a second terminal:

   ```sh
   npm run dev
   ```

5. Open the local URL printed by Vite, usually `http://localhost:5173`.

Run the checks with `npm test` and create a production build with
`npm run build`.

## Short recording

With both terminals running, record the app loading the starter groups, creating
a group, adding a member, recording a contribution, changing a paid status, and
deleting the member and group. Save the recording as
`submission/server-crud.mp4` before submitting.

## API actions

| Action | Request |
| --- | --- |
| Read groups, members, and contributions | `GET /groups`, `GET /members`, `GET /contributions` |
| Create a group or contribution | `POST /groups`, `POST /contributions` |
| Add a member | `POST /members` |
| Change paid status | `PATCH /members/:id` |
| Remove a member or group | `DELETE /members/:id`, `DELETE /groups/:id` |

Deleting a group also removes its members and contributions. The JSON file is
for local class work; it is not a hosted or production database. The server
disables automatic foreign-key cleanup so a removed member's contribution
history stays available; group deletion removes related records explicitly.
