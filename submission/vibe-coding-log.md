# Vibe Coding Log

This log records AI-assisted work on the Milestone 1 project. Review it, correct anything that does not match your own experience, and add your own checks before submitting.

## What AI helped create or change

- Expanded the existing Susu Circle TypeScript domain model into a local Express and SQLite application.
- Added registration, login/logout, session handling, circle creation and joining, contribution recording, and owner-recorded payout progression.
- Added a browser interface, environment example, project scripts, and an API integration test.
- Added group frequency/start-date fields, a reusable `Field` component, validated group and contribution forms, and direct group detail URLs. The API validates member permissions and stores the added dates.
- Captured local screenshots for group validation/success and contribution validation/success in `submission/evidence/`.
- Added a React Context/Hook exercise in `contexts-and-hooks/`, with starter JSON, `GroupsContext`, shared mutation actions, and components that consume `useGroups` directly.
- Drafted the README, presentation outline, and submission templates. Review the drafts and add your own presentation notes and reflection.

## What was checked during development

- `npm run typecheck`
- `npm test` — health, authentication, member privacy, joining, contributions, payout progression, logout, and legacy database migration.
- `npm run lint`
- `npm run build` passed; `npm audit` was not rerun for the forms update.
- Manual local browser checks for field errors, group creation and `/groups/:id` reload, future contribution-date rejection, and contribution persistence after refresh.
- In `contexts-and-hooks/`, `npm test` passed (5 tests) and `npm run build` passed.
- Browser-checked starter JSON loading, group/member/contribution actions, header total, and localStorage persistence after refresh.

These are development checks performed during implementation, not a claim that the student independently reviewed every line or completed the live-site requirements. Re-run the checks and review the screenshots before submission.

## What I still need to check myself

- Re-run `npm audit`; save genuine screenshots of passing test/lint output if the rubric still requires them.
- Review the form screenshots and decide whether to include a second member in the presentation.
- Verify `/health` and login on the deployed live site after deployment.
- Create two rehearsal accounts with non-reused passwords; never commit their credentials.
- Read the authentication, membership, contribution, and payout code and make sure I can explain it.
- Present with a timer, collect real partner feedback, make the weakest point better, and rehearse again.
- Make a backup recording and verify that it plays.
- Replace the reflection template with answers to the exact Week 23 questions in my own words.
