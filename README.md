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

```bash
npm install
cp .env.example .env.local
# set SESSION_SECRET to a long random value
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

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

OTP steps show a demonstration code because the university SMS/email gateway is not wired in this prototype.

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
