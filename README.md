# Phase-2-Project-KCA

Secure electronic voting and electoral management for simulated KCA University (SAKU) elections. This is not an online form for collecting votes. It is an end-to-end election administration platform.

KCA brand colours used throughout:

- Deep blue / navy `#182B5C`
- Gold / yellow `#D0B216`

## What this first slice covers

The Electoral Commission portal is the starting account. Other stakeholders (candidate, agent, voter, judiciary, public broadcast) can later share this platform as role-based views. ICT/system administration is **not** an election-operational account and cannot enter this portal.

1. Public landing page with a dynamic election-status line
2. Commission login with Work ID + institutional password (not a hard-coded National ID scheme)
3. MFA / OTP
4. Permission check: identity → role → election assignment → current stage → authorized access
5. Shared authenticated shell (top bar, sidebar, notifications, session timeout)
6. Role-based dashboard for Chair, Vice Chair, Secretary General, and Commissioner

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
| `KCAU-EC-001` | Prof. Amina Wanjiku | Commission Chair | Full electoral authority, including results authorization |
| `KCAU-EC-002` | Dr. David Omondi | Vice Chair | Opening/closing; cannot authorize official results |
| `KCAU-EC-003` | Ms. Grace Mutiso | Secretary General | Operational powers; no final authorization |
| `KCAU-EC-004` | Mr. Kevin Otieno | Commissioner (Ruaraka) | Station duties and candidate approval |
| `KCAU-EC-005` | Ms. Faith Chebet | Commissioner (Town) | Station duties and candidate approval |
| `KCAU-EC-006` | Mr. Brian Mwangi | Commissioner (Kitengela) | Station duties and candidate approval |
| `KCAU-EC-007` | Ms. Lydia Achieng | Commissioner (Distance Learning) | Station duties and candidate approval |
| `KCAU-ICT-001` | Eng. Peter Kamau | Systems Administrator | Credentials may verify; Commission access is denied |

The OTP step shows a demonstration code because the university SMS/email gateway is not wired in this slice.

## Architecture notes

- **Institutional directory** proves who you are.
- **Commission membership** proves you belong in this portal.
- **Role** (Chair, Vice Chair, Secretary General, Commissioner) proves what you may do.
- **Election assignment and stage** further restrict those powers.
- Technical work (configuration, databases, deployment, backups, raw security logs) stays outside Commission accounts.
