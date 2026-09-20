import type {
  AppStore,
  CommissionMember,
  InstitutionalUser,
} from "@/lib/types";

export { DEMO_ACCOUNTS, DEMO_PASSWORD } from "@/lib/demo-accounts";

const DEMO_PASSWORD_HASH =
  "$2b$10$7Ty1982sTG6WMko6.C9kHuJztfZpyfErzjvdxqoHiZYBL4O7B4u8.";

export const ELECTION_ID = "saku-2026";

export const INSTITUTIONAL_DIRECTORY: InstitutionalUser[] = [
  {
    id: "user-chair",
    workId: "KCAU-EC-001",
    fullName: "Prof. Amina Wanjiku",
    shortName: "Prof. Wanjiku",
    title: "Commission Chair",
    email: "amina.wanjiku@kcau.ac.ke",
    passwordHash: DEMO_PASSWORD_HASH,
    accountKind: "commission",
  },
  {
    id: "user-vice",
    workId: "KCAU-EC-002",
    fullName: "Dr. David Omondi",
    shortName: "Dr. Omondi",
    title: "Vice Chair",
    email: "david.omondi@kcau.ac.ke",
    passwordHash: DEMO_PASSWORD_HASH,
    accountKind: "commission",
  },
  {
    id: "user-sg",
    workId: "KCAU-EC-003",
    fullName: "Ms. Grace Mutiso",
    shortName: "Ms. Mutiso",
    title: "Secretary General",
    email: "grace.mutiso@kcau.ac.ke",
    passwordHash: DEMO_PASSWORD_HASH,
    accountKind: "commission",
  },
  {
    id: "user-com-ruaraka",
    workId: "KCAU-EC-004",
    fullName: "Mr. Kevin Otieno",
    shortName: "Mr. Otieno",
    title: "Commissioner",
    email: "kevin.otieno@kcau.ac.ke",
    passwordHash: DEMO_PASSWORD_HASH,
    accountKind: "commission",
  },
  {
    id: "user-com-town",
    workId: "KCAU-EC-005",
    fullName: "Ms. Faith Chebet",
    shortName: "Ms. Chebet",
    title: "Commissioner",
    email: "faith.chebet@kcau.ac.ke",
    passwordHash: DEMO_PASSWORD_HASH,
    accountKind: "commission",
  },
  {
    id: "user-com-kitengela",
    workId: "KCAU-EC-006",
    fullName: "Mr. Brian Mwangi",
    shortName: "Mr. Mwangi",
    title: "Commissioner",
    email: "brian.mwangi@kcau.ac.ke",
    passwordHash: DEMO_PASSWORD_HASH,
    accountKind: "commission",
  },
  {
    id: "user-com-distance",
    workId: "KCAU-EC-007",
    fullName: "Ms. Lydia Achieng",
    shortName: "Ms. Achieng",
    title: "Commissioner",
    email: "lydia.achieng@kcau.ac.ke",
    passwordHash: DEMO_PASSWORD_HASH,
    accountKind: "commission",
  },
  {
    id: "user-ict",
    workId: "KCAU-ICT-001",
    fullName: "Eng. Peter Kamau",
    shortName: "Eng. Kamau",
    title: "Systems Administrator",
    email: "peter.kamau@kcau.ac.ke",
    passwordHash: DEMO_PASSWORD_HASH,
    accountKind: "technical",
  },
];

export const COMMISSION_MEMBERS: CommissionMember[] = [
  {
    id: "member-chair",
    userId: "user-chair",
    role: "CHAIR",
    electionId: ELECTION_ID,
    pollingStationIds: ["ps-ruaraka", "ps-town", "ps-kitengela", "ps-distance"],
    active: true,
  },
  {
    id: "member-vice",
    userId: "user-vice",
    role: "VICE_CHAIR",
    electionId: ELECTION_ID,
    pollingStationIds: ["ps-ruaraka", "ps-town", "ps-kitengela", "ps-distance"],
    active: true,
  },
  {
    id: "member-sg",
    userId: "user-sg",
    role: "SECRETARY_GENERAL",
    electionId: ELECTION_ID,
    pollingStationIds: ["ps-ruaraka", "ps-town", "ps-kitengela", "ps-distance"],
    active: true,
  },
  {
    id: "member-004",
    userId: "user-com-ruaraka",
    role: "COMMISSIONER",
    electionId: ELECTION_ID,
    pollingStationIds: ["ps-ruaraka"],
    active: true,
  },
  {
    id: "member-005",
    userId: "user-com-town",
    role: "COMMISSIONER",
    electionId: ELECTION_ID,
    pollingStationIds: ["ps-town"],
    active: true,
  },
  {
    id: "member-006",
    userId: "user-com-kitengela",
    role: "COMMISSIONER",
    electionId: ELECTION_ID,
    pollingStationIds: ["ps-kitengela"],
    active: true,
  },
  {
    id: "member-007",
    userId: "user-com-distance",
    role: "COMMISSIONER",
    electionId: ELECTION_ID,
    pollingStationIds: ["ps-distance"],
    active: true,
  },
];

export function createInitialStore(): AppStore {
  const now = "2026-09-18T08:00:00.000Z";

  return {
    election: {
      id: ELECTION_ID,
      name: "SAKU Elections 2026",
      shortName: "SAKU 2026",
      year: 2026,
      stage: "VOTING",
      openedAt: now,
      closedAt: null,
      resultsAuthorizedAt: null,
      resultsAuthorizedBy: null,
    },
    pollingStations: [
      {
        id: "ps-ruaraka",
        name: "Ruaraka Main Campus",
        campus: "Ruaraka",
        code: "RU-01",
      },
      {
        id: "ps-town",
        name: "Town Campus",
        campus: "Nairobi CBD",
        code: "TN-01",
      },
      {
        id: "ps-kitengela",
        name: "Kitengela Campus",
        campus: "Kitengela",
        code: "KT-01",
      },
      {
        id: "ps-distance",
        name: "Distance & eLearning Centre",
        campus: "Virtual",
        code: "DL-01",
      },
    ],
    candidates: [
      {
        id: "cand-01",
        fullName: "Janet Njeri",
        ticket: "Unity Ticket",
        position: "SAKU Chairperson",
        campus: "Ruaraka",
        status: "approved",
        reviewedBy: "Prof. Amina Wanjiku",
        reviewedAt: "2026-09-10T11:20:00.000Z",
      },
      {
        id: "cand-02",
        fullName: "Samuel Kariuki",
        ticket: "Progress Ticket",
        position: "SAKU Chairperson",
        campus: "Town Campus",
        status: "approved",
        reviewedBy: "Prof. Amina Wanjiku",
        reviewedAt: "2026-09-10T11:24:00.000Z",
      },
      {
        id: "cand-03",
        fullName: "Mercy Atieno",
        ticket: "Unity Ticket",
        position: "Secretary General",
        campus: "Ruaraka",
        status: "pending",
      },
      {
        id: "cand-04",
        fullName: "Collins Mwenda",
        ticket: "Independent",
        position: "Finance Secretary",
        campus: "Kitengela",
        status: "pending",
      },
      {
        id: "cand-05",
        fullName: "Aisha Mohamed",
        ticket: "Progress Ticket",
        position: "Academic Secretary",
        campus: "Distance Learning",
        status: "pending",
      },
    ],
    voterRegister: {
      version: "VR-2026-03",
      status: "locked",
      voterCount: 12840,
      submittedAt: "2026-09-12T16:00:00.000Z",
      approvedAt: "2026-09-14T09:30:00.000Z",
      approvedBy: "Ms. Grace Mutiso",
    },
    notifications: [
      {
        id: "n-1",
        title: "Voting is in progress",
        body: "SAKU Elections 2026 is open. Station commissioners should monitor turnout and incidents.",
        createdAt: now,
        read: false,
        href: "/commission/election-control",
        audience: "all",
      },
      {
        id: "n-2",
        title: "Three nominations still pending",
        body: "Candidate approval remains available to the Commission while voting continues only for the already gazetted list. Late files need a recorded decision.",
        createdAt: "2026-09-17T14:12:00.000Z",
        read: false,
        href: "/commission/candidates",
        audience: "all",
      },
      {
        id: "n-3",
        title: "Results authorization is reserved to the Chair",
        body: "When voting closes, only the Commission Chair can authorize official results.",
        createdAt: "2026-09-16T10:00:00.000Z",
        read: false,
        href: "/commission/results",
        audience: ["CHAIR", "VICE_CHAIR"],
      },
    ],
    auditLog: [
      {
        id: "a-1",
        at: "2026-09-14T09:30:00.000Z",
        actorWorkId: "KCAU-EC-003",
        actorName: "Ms. Grace Mutiso",
        action: "approve_voter_register",
        detail: "Approved voter register VR-2026-03 (12,840 voters).",
        highRisk: false,
      },
      {
        id: "a-2",
        at: now,
        actorWorkId: "KCAU-EC-001",
        actorName: "Prof. Amina Wanjiku",
        action: "authorize_election_opening",
        detail: "Authorized opening of SAKU Elections 2026.",
        highRisk: true,
      },
    ],
  };
}

export function findDirectoryUser(workId: string) {
  const normalized = workId.trim().toUpperCase();
  return (
    INSTITUTIONAL_DIRECTORY.find((user) => user.workId === normalized) ?? null
  );
}

export function findDirectoryUserById(id: string) {
  return INSTITUTIONAL_DIRECTORY.find((user) => user.id === id) ?? null;
}

export function findCommissionMemberByUserId(userId: string) {
  return COMMISSION_MEMBERS.find((member) => member.userId === userId) ?? null;
}
