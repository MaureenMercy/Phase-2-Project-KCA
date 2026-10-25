# Phase-2-Project-KCA

Secure electronic voting and electoral management for simulated KCA University (SAKU) elections. This is not an online form for collecting votes. It is an end-to-end election administration platform.

KCA brand colours used throughout:

- Deep blue / navy `#182B5C`
- Gold / yellow `#D0B216`

## What this slice covers

The Electoral Commission portal is the starting account. Other stakeholders can later share this platform as role-based views. ICT/system administration is **not** an election-operational account and cannot enter this portal.

1. Public landing page with a dynamic election-status line
2. Commission login with Work ID + institutional password (not a hard-coded National ID scheme)
3. MFA / OTP, then a visible permission check
4. Shared authenticated shell (top bar, persistent desktop sidebar, permission-aware navigation, notifications, session timeout, subtle KCA watermark)
5. Two connected election stages: Election 1 (delegate / electoral college) and the SAKU leadership / Cabinet election
6. Official campus → school → optional department structure, with configurable `delegate_seats` (never defaulted)
7. Station-assigned commissioners acting as election officers
8. Incident log with evidence upload (the only Commission function intended for a phone)
9. Restricted emergency pause/resume with Chair + Vice Chair two-person authorization
10. Sequential Cabinet ballot: registration number + OTP, one contest at a time, joint presidential ticket, review, then lock

Authentication is not authorization. A commissioner may sign in successfully and still be refused a given action.

## Run locally

The pages stay on Next.js (port 3000). Vote records, workstation IPs, access policy, and candidate portraits persist on a separate operations API (port 4000) backed by MongoDB (port 27017). If the API is down, voting still works against the in-page store; tracking and IP restrictions pause.

```bash
npm install
cp .env.example .env.local
# set SESSION_SECRET to a long random value
npm run dev:stack
```

`npm run dev:stack` starts MongoDB (embedded on 27017 unless `MONGODB_URI` is set), the operations API on 4000, and the Next.js UI on 3000. Use `npm run api` if you only need the backend.

Open [http://localhost:3000](http://localhost:3000).

Commission tracking lives at `/commission/tracking`, workstation access at `/commission/access`, and bar-graph analytics at `/commission/analytics`. Student desk: `/elector` with any seeded Student ID and PIN `SAKU2026`.

```bash
npm test
npm run lint
npm run build
```

## Demonstration accounts

Password for every seeded directory account: `KCAU@2026`

| Work ID | Name | Role | Expected result |
| --- | --- | --- | --- |
| `KCAU-EC-001` | Prof. Amina Wanjiku | Commission Chair | Full electoral authority, including results authorization and emergency initiation |
| `KCAU-EC-002` | Dr. David Omondi | Vice Chair | Opening/closing and emergency co-authorization; cannot authorize official results |
| `KCAU-EC-003` | Ms. Grace Mutiso | Secretary General | Operational powers; no final authorization |
| `KCAU-EC-004` | Mr. Kevin Otieno | Commissioner (Ruaraka) | Station officer functions and candidate approval |
| `KCAU-EC-005` | Ms. Faith Chebet | Commissioner (Town) | Station officer functions and candidate approval |
| `KCAU-EC-006` | Mr. Brian Mwangi | Commissioner (Kitengela) | Station officer functions and candidate approval |
| `KCAU-EC-007` | Ms. Lydia Achieng | Commissioner (Western) | Station officer functions and candidate approval |
| `KCAU-ICT-001` | Eng. Peter Kamau | Systems Administrator | Credentials may verify; Commission access is denied |

OTP steps show a demonstration code because the university SMS/email gateway is not wired in this prototype. On the Vercel demo host the code is always `202026`.

## How the Chair opens Election 1

Saving the election name and date does **not** configure Election 1. Seats start empty on purpose.

1. Sign in as Chair: Work ID `KCAU-EC-001`, password `KCAU@2026`, OTP `202026`.
2. On the dashboard, find **How to open Election 1**.
3. Type `2` and allocate remaining units (or open Election → Electoral College → Electoral structure).
4. Click **Authorize opening** and re-enter `KCAU@2026` when asked.
5. The lifecycle pill should read **Voting in progress**.

The in-app copy of this walkthrough is at `/commission/guide`.

## Submission links (paste into the form)

Live app (Vercel): **claim this first** so reviewers can keep using it. Anonymous previews expire in about an hour unless transferred to a Vercel account.

| What the form asks for | Link |
| --- | --- |
| Live / hosted system | https://temporary-agile-xenon-dfu2nfz.vercel.app |
| Keep the live app (claim on Vercel) | https://vercel.com/claim-deployment?code=ddbe590c-1957-4b19-b77c-b6c14b234ece |
| Pitch deck PDF (~1 MB, 12 slides) | https://temporary-agile-xenon-dfu2nfz.vercel.app/saku-pitch-deck.pdf |
| Screenshots gallery | https://temporary-agile-xenon-dfu2nfz.vercel.app/demo |
| Demo video | https://temporary-agile-xenon-dfu2nfz.vercel.app/saku-demo.mp4 |

Durable GitHub copies (do not expire if you claim Vercel too late):

- Pitch deck PDF: https://github.com/MaureenMercy/Phase-2-Project-KCA/blob/cursor/saku-vercel-submission-ffaa/public/saku-pitch-deck.pdf
- Direct PDF download: https://github.com/MaureenMercy/Phase-2-Project-KCA/raw/cursor/saku-vercel-submission-ffaa/public/saku-pitch-deck.pdf
- Screenshots: https://github.com/MaureenMercy/Phase-2-Project-KCA/tree/cursor/saku-vercel-submission-ffaa/public/demo/screenshots
- Demo video: https://github.com/MaureenMercy/Phase-2-Project-KCA/raw/cursor/saku-vercel-submission-ffaa/public/saku-demo.mp4

Chair login: Work ID `KCAU-EC-001`, password `KCAU@2026`, OTP `202026`.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/MaureenMercy/Phase-2-Project-KCA)

## Prototype voting desks

These are physical-station interfaces, not public social polls.

- Election 1 (students): [http://localhost:3000/elector](http://localhost:3000/elector) — Student ID + PIN `SAKU2026`
- Cabinet (delegates): [http://localhost:3000/vote](http://localhost:3000/vote) — registration number from the generated Electoral College Register + OTP

Election 1 cannot open, and a student cannot receive a ballot, while any active electoral unit has unconfigured delegate seats.

The Cabinet desk unlocks only after Election 1 results are finalized and the Electoral College Register is verified. That register is derived automatically. There is no manual “add elector” path.

## Architecture notes

- **Institutional directory** proves who you are.
- **Commission membership** proves you belong in this portal.
- **Role** (Chair, Vice Chair, Secretary General, Commissioner) proves what you may do.
- **Election assignment and stage** further restrict those powers.
- **Station assignment** activates election-officer functions for the four operational commissioners.
- Technical work (configuration, databases, deployment, backups, raw security logs) stays outside Commission accounts.

Do not implement live KCA ERP or fee-clearance integration in this prototype. Mock first-year students are the test electorate so the workflow can be validated without production eligibility systems.
