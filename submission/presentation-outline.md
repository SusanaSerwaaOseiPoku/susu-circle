# Five-minute presentation outline

Use the local app until a public deployment is available. Replace the local URL with the verified live URL before presenting the final submission. Create two test accounts yourself before the timed run; do not use real member data.

| Time      | Activity                                                                                                                                                                            |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0:00–0:30 | Introduce Susu Circle: it helps a group organize contributions and payout turns; it records activity but does not move money.                                                       |
| 0:30–1:10 | Log in as Account A. Show the dashboard and create a circle with a clear name and a small whole-number contribution amount.                                                         |
| 1:10–1:50 | Show the invite code. Log in as Account B in a separate browser/private window and join the circle using that code.                                                                 |
| 1:50–2:40 | Return to each account and record the current round's contribution. Show the member count and contribution status.                                                                  |
| 2:40–3:20 | As the owner, record the payout after all members have contributed. Show the payout record and that the round advances. Explain that this records a payout; it does not send money. |
| 3:20–4:35 | Walk through one contribution request in your own words, using the three files below.                                                                                               |
| 4:35–5:00 | Close with the main limitation and one idea for Milestone 2. Invite questions.                                                                                                      |

## Code walkthrough: one contribution request

Use `POST /api/groups/:groupId/contributions` as the example. In your own words, explain that the signed-in member's request passes through authentication, the server verifies they belong to the circle and that the amount matches, then SQLite records one contribution for the current round. The database's uniqueness rule prevents that member from recording a second contribution in the same round.

Three files to explain:

- `src/app.ts` — defines the API routes and checks circle membership, contribution amount, and payout rules.
- `src/auth.ts` — hashes passwords and validates signed session cookies before protected routes run.
- `src/db.ts` — creates the SQLite tables and their constraints for accounts, circles, contributions, and payouts.

## Surprise-question practice

Answer each in under 30 seconds, then verify the answer by pointing to the relevant code:

1. **What would break if you removed `requireAuth`?** Protected routes could run without a verified user, so requests could access or change circle data without a valid session. The membership check is also important; authentication alone does not grant access to every circle.
2. **Why store a hash of the session ID instead of the ID itself?** A read-only database leak would not directly reveal a usable session token. The browser cookie is also signed so a modified token is rejected.
3. **Does recording a payout send money?** No. It saves a payout record and advances the round; there is no payment integration or movement of funds.

## After the rehearsal

Ask your partner to write one thing that went well and one thing to improve. Swap roles, then fix your weakest point and rehearse again. Add the partner's actual feedback, recording, and any final changes yourself; do not invent them in advance.
