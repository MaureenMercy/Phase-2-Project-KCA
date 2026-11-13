import { portraitDataUri } from "@/lib/portraits";
import {
  DEFAULT_IDENTITY_DOCUMENT_POLICY,
  last4,
  mockNationalId,
  mockPhone,
  programmeLabelFor,
} from "@/lib/identity";
import { encryptNationalId, hashNationalId } from "@/lib/identity-crypto";
import type {
  AppStore,
  AssignmentRecord,
  CabinetCandidate,
  Campus,
  CandidatePortalApplication,
  CandidateProfile,
  CommissionMember,
  ElectoralDepartment,
  ElectoralUnitConfiguration,
  InstitutionalUser,
  PollingStation,
  PortalConfig,
  PortalNotification,
  Programme,
  School,
  StudentIdentity,
} from "@/lib/types";
import { STORE_VERSION } from "@/lib/types";
import {
  CONFIG_VERSION,
  CYCLE_ID,
  ELECTION_1_ID,
  ELECTION_2_ID,
  SEAT_REVIEW_NOTE,
  SEAT_SOURCE,
  SEED_PEOPLE,
  type SeedPerson,
  buildAgents,
  buildCouncilApplications,
  buildDelegateApplications,
  buildDelegateCandidates,
  buildIncidents,
  buildStudentElectors,
  buildStudentMappings,
  buildVoterExceptions,
  buildVoterPortalSeed,
} from "@/lib/seed-electorate";

export { CYCLE_ID, ELECTION_1_ID, ELECTION_2_ID } from "@/lib/seed-electorate";

export { DEMO_ACCOUNTS, DEMO_PASSWORD } from "@/lib/demo-accounts";

const DEMO_PASSWORD_HASH =
  "$2b$10$7Ty1982sTG6WMko6.C9kHuJztfZpyfErzjvdxqoHiZYBL4O7B4u8.";

const now = "2026-09-18T08:00:00.000Z";

export const ELECTION_ID = ELECTION_1_ID;

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
    id: "user-com-western",
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
    electionId: CYCLE_ID,
    pollingStationIds: [],
    active: true,
  },
  {
    id: "member-vice",
    userId: "user-vice",
    role: "VICE_CHAIR",
    electionId: CYCLE_ID,
    pollingStationIds: [],
    active: true,
  },
  {
    id: "member-sg",
    userId: "user-sg",
    role: "SECRETARY_GENERAL",
    electionId: CYCLE_ID,
    pollingStationIds: [],
    active: true,
  },
  {
    id: "member-004",
    userId: "user-com-ruaraka",
    role: "COMMISSIONER",
    electionId: CYCLE_ID,
    pollingStationIds: ["ps-ruaraka"],
    active: true,
  },
  {
    id: "member-005",
    userId: "user-com-town",
    role: "COMMISSIONER",
    electionId: CYCLE_ID,
    pollingStationIds: ["ps-town"],
    active: true,
  },
  {
    id: "member-006",
    userId: "user-com-kitengela",
    role: "COMMISSIONER",
    electionId: CYCLE_ID,
    pollingStationIds: ["ps-kitengela"],
    active: true,
  },
  {
    id: "member-007",
    userId: "user-com-western",
    role: "COMMISSIONER",
    electionId: CYCLE_ID,
    pollingStationIds: ["ps-western"],
    active: true,
  },
];

function stamp<T extends { createdAt: string; updatedAt: string }>(
  record: Omit<T, "createdAt" | "updatedAt">,
): T {
  return { ...record, createdAt: now, updatedAt: now } as T;
}

export const CAMPUSES: Campus[] = [
  stamp({ id: "campus-ruaraka", name: "Ruaraka", code: "RU", electoralStructure: "DEPARTMENT", status: "active" }),
  stamp({ id: "campus-western", name: "Western", code: "WE", electoralStructure: "SCHOOL", status: "active" }),
  stamp({ id: "campus-town", name: "Town", code: "TN", electoralStructure: "CAMPUS_WIDE", status: "active" }),
  stamp({ id: "campus-kitengela", name: "Kitengela", code: "KT", electoralStructure: "CAMPUS_WIDE", status: "active" }),
];

type SchoolSeed = { id: string; campusId: string; name: string; code: string };

const SCHOOL_SEEDS: SchoolSeed[] = [
  { id: "school-ru-bus", campusId: "campus-ruaraka", name: "School of Business", code: "RU-BUS" },
  { id: "school-ru-tech", campusId: "campus-ruaraka", name: "School of Technology", code: "RU-TECH" },
  { id: "school-ru-eass", campusId: "campus-ruaraka", name: "School of Education, Arts, and Social Sciences", code: "RU-EASS" },
  { id: "school-ru-ptti", campusId: "campus-ruaraka", name: "KCAU Professional and Technical Training Institute", code: "RU-PTTI" },
  { id: "school-we-tech", campusId: "campus-western", name: "School of Technology", code: "WE-TECH" },
  { id: "school-we-bus", campusId: "campus-western", name: "School of Business", code: "WE-BUS" },
  { id: "school-we-ptti", campusId: "campus-western", name: "KCAU Professional and Technical Training Institute", code: "WE-PTTI" },
  { id: "school-tn-bus", campusId: "campus-town", name: "School of Business", code: "TN-BUS" },
  { id: "school-tn-tech", campusId: "campus-town", name: "School of Technology", code: "TN-TECH" },
  { id: "school-tn-eass", campusId: "campus-town", name: "School of Education, Arts, and Social Sciences", code: "TN-EASS" },
  { id: "school-tn-ptti", campusId: "campus-town", name: "KCAU Professional and Technical Training Institute", code: "TN-PTTI" },
  { id: "school-kt-bus", campusId: "campus-kitengela", name: "School of Business", code: "KT-BUS" },
  { id: "school-kt-tech", campusId: "campus-kitengela", name: "School of Technology", code: "KT-TECH" },
  { id: "school-kt-ptti", campusId: "campus-kitengela", name: "KCAU Professional and Technical Training Institute", code: "KT-PTTI" },
];

export const SCHOOLS: School[] = SCHOOL_SEEDS.map((school) =>
  stamp({ ...school, status: "active" }),
);

type DeptSeed = { id: string; schoolId: string; name: string; code: string };

const DEPT_SEEDS: DeptSeed[] = [
  { id: "dept-ru-bus-bam", schoolId: "school-ru-bus", name: "Department of Business Administration and Management", code: "RU-BUS-BAM" },
  { id: "dept-ru-bus-af", schoolId: "school-ru-bus", name: "Department of Accounting and Finance", code: "RU-BUS-AF" },
  { id: "dept-ru-bus-es", schoolId: "school-ru-bus", name: "Department of Economics and Statistics", code: "RU-BUS-ES" },
  { id: "dept-ru-tech-sdis", schoolId: "school-ru-tech", name: "Department of Software Development & Information Systems", code: "RU-TECH-SDIS" },
  { id: "dept-ru-tech-nac", schoolId: "school-ru-tech", name: "Department of Networking and Applied Computing", code: "RU-TECH-NAC" },
  { id: "dept-ru-eass-eps", schoolId: "school-ru-eass", name: "Department of Educational and Psychological Studies", code: "RU-EASS-EPS" },
  { id: "dept-ru-eass-pafmes", schoolId: "school-ru-eass", name: "Department of Performing Arts, Film, Media, and Economic Studies", code: "RU-EASS-PAFMES" },
  { id: "dept-ru-ptti-pro", schoolId: "school-ru-ptti", name: "Professional Programmes Department", code: "RU-PTTI-PRO" },
  { id: "dept-ru-ptti-acad", schoolId: "school-ru-ptti", name: "Academic Programmes Department", code: "RU-PTTI-ACAD" },
];

export const DEPARTMENTS: ElectoralDepartment[] = DEPT_SEEDS.map((dept) =>
  stamp({ ...dept, status: "active" }),
);

export const PROGRAMMES: Programme[] = [];

function constitutionalSeats(unitId: string): ElectoralUnitConfiguration {
  return {
    id: unitId,
    electionId: ELECTION_1_ID,
    campusId: "",
    schoolId: null,
    departmentId: null,
    programId: null,
    unitKind: "DEPARTMENT",
    delegateSeats: 3,
    seatStatus: "APPROVED",
    allocationSource: SEAT_SOURCE,
    allocationVersion: CONFIG_VERSION,
    allocationReviewNote: SEAT_REVIEW_NOTE,
    configurationVersionId: CONFIG_VERSION,
    status: "active",
    createdAt: now,
    updatedAt: now,
  };
}

export function createElectoralUnits(electionId: string): ElectoralUnitConfiguration[] {
  const units: ElectoralUnitConfiguration[] = [];

  for (const campus of CAMPUSES) {
    if (campus.electoralStructure === "CAMPUS_WIDE") {
      units.push({
        ...constitutionalSeats(`unit-${campus.id}-campus`),
        electionId,
        campusId: campus.id,
        schoolId: null,
        departmentId: null,
        unitKind: "CAMPUS_WIDE",
      });
      continue;
    }

    const schools = SCHOOLS.filter((school) => school.campusId === campus.id);
    if (campus.electoralStructure === "SCHOOL") {
      for (const school of schools) {
        units.push({
          ...constitutionalSeats(`unit-${campus.id}-${school.id}-school`),
          electionId,
          campusId: campus.id,
          schoolId: school.id,
          departmentId: null,
          unitKind: "SCHOOL",
        });
      }
      continue;
    }

    for (const school of schools) {
      const departments = DEPARTMENTS.filter((dept) => dept.schoolId === school.id);
      for (const department of departments) {
        units.push({
          ...constitutionalSeats(`unit-${campus.id}-${school.id}-${department.id}`),
          electionId,
          campusId: campus.id,
          schoolId: school.id,
          departmentId: department.id,
          unitKind: "DEPARTMENT",
        });
      }
    }
  }

  return units;
}

export const STUDENT_ELECTORS = buildStudentElectors();
export const STUDENT_MAPPINGS = buildStudentMappings();
export const DELEGATE_CANDIDATES = buildDelegateCandidates();

function programmeForPerson(person: Pick<SeedPerson, "schoolId" | "departmentId">) {
  const department = DEPARTMENTS.find((item) => item.id === person.departmentId);
  const school = SCHOOLS.find((item) => item.id === person.schoolId);
  return programmeLabelFor({
    departmentName: department?.name,
    schoolName: school?.name,
  });
}

export function buildStudentIdentity(
  person: SeedPerson & { recordSource?: StudentIdentity["recordSource"] },
): StudentIdentity {
  const nationalId = mockNationalId(person.studentId);
  return stamp({
    id: `sid-${person.studentId.replace("/", "-")}`,
    studentId: person.studentId,
    fullName: person.fullName,
    phoneNumber: mockPhone(person.studentId),
    campusId: person.campusId,
    schoolId: person.schoolId,
    departmentId: person.departmentId,
    programId: null,
    programmeLabel: programmeForPerson(person),
    nationalIdHash: hashNationalId(nationalId),
    nationalIdEncrypted: encryptNationalId(nationalId),
    nationalIdLast4: last4(nationalId),
    recordSource: person.recordSource ?? "mock_first_year_register",
  });
}

export const STUDENT_IDENTITIES: StudentIdentity[] = SEED_PEOPLE.map((person) =>
  buildStudentIdentity(person),
);

export const DEFAULT_PORTAL_CONFIG: PortalConfig = {
  identityDocumentTypes: [{ id: "national_id", label: "Kenyan National ID", enabled: true }],
  alternativeIdPolicyStatus: "awaiting_commission",
  applicationWindows: {
    DELEGATE: {
      status: "configured",
      opensAt: "2026-09-01T00:00:00.000Z",
      closesAt: "2026-12-31T23:59:59.000Z",
    },
    SAKU_COUNCIL: {
      status: "configured",
      opensAt: "2026-09-01T00:00:00.000Z",
      closesAt: "2026-12-31T23:59:59.000Z",
    },
  },
  jointTicketWorkflowStatus: "awaiting_commission",
  maxAgentsPerCandidate: 2,
  acceptedPhotoTypes: ["image/jpeg", "image/png"],
  acceptedDocumentTypes: ["image/jpeg", "image/png", "application/pdf"],
  maxPhotoBytes: 2 * 1024 * 1024,
  maxDocumentBytes: 5 * 1024 * 1024,
  councilPositions: [
    {
      id: "pos-special-interests",
      contestId: "special-interests",
      title: "Special Interests Secretary",
      openForApplications: true,
      jointTicket: false,
      eligibilitySummary: [
        "Must be a currently registered KCA University student.",
        "Must meet the eligibility rules the Electoral Commission has configured for this position.",
      ],
      requiredDocuments: [{ id: "campaign-statement", label: "Campaign statement", required: true }],
    },
    {
      id: "pos-sports",
      contestId: "sports",
      title: "Sports & Entertainment Secretary",
      openForApplications: false,
      jointTicket: false,
      eligibilitySummary: [
        "Must be a currently registered KCA University student.",
        "Must meet the eligibility rules the Electoral Commission has configured for this position.",
      ],
      requiredDocuments: [{ id: "campaign-statement", label: "Campaign statement", required: true }],
    },
    {
      id: "pos-academic",
      contestId: "academic",
      title: "Academic Secretary",
      openForApplications: true,
      jointTicket: false,
      eligibilitySummary: [
        "Must be a currently registered KCA University student.",
        "Must meet the eligibility rules the Electoral Commission has configured for this position.",
      ],
      requiredDocuments: [{ id: "campaign-statement", label: "Campaign statement", required: true }],
    },
    {
      id: "pos-treasurer",
      contestId: "treasurer",
      title: "Treasurer / Finance Secretary",
      openForApplications: true,
      jointTicket: false,
      eligibilitySummary: [
        "Must be a currently registered KCA University student.",
        "Must meet the eligibility rules the Electoral Commission has configured for this position.",
      ],
      requiredDocuments: [{ id: "campaign-statement", label: "Campaign statement", required: true }],
    },
    {
      id: "pos-secretary-general",
      contestId: "secretary-general",
      title: "Secretary General",
      openForApplications: true,
      jointTicket: false,
      eligibilitySummary: [
        "Must be a currently registered KCA University student.",
        "Must meet the eligibility rules the Electoral Commission has configured for this position.",
      ],
      requiredDocuments: [{ id: "campaign-statement", label: "Campaign statement", required: true }],
    },
    {
      id: "pos-president",
      contestId: "president-ticket",
      title: "President / Vice President",
      openForApplications: true,
      jointTicket: true,
      eligibilitySummary: [
        "This contest uses a joint ticket when the Electoral Commission has configured that workflow.",
        "The joint-ticket registration process is not yet configured.",
      ],
      requiredDocuments: [{ id: "ticket-statement", label: "Joint ticket statement", required: true }],
    },
  ],
  delegateRequiredDocuments: [
    { id: "candidate-statement", label: "Candidate statement", required: true },
  ],
};

const COLLINS = STUDENT_IDENTITIES.find((item) => item.studentId === "24/01511")!;

export const SEEDED_CANDIDATE_PROFILES: CandidateProfile[] = [
  stamp({
    id: "cprof-collins",
    studentId: COLLINS.studentId,
  }),
];

const seededPhoto: CandidatePortalApplication["photograph"] = {
  id: "file-collins-photo",
  kind: "photograph",
  filename: "collins-portrait.jpg",
  mimeType: "image/jpeg",
  size: 1200,
  dataUrl: portraitDataUri("Collins Mwenda Mutua", 40),
  uploadedAt: now,
};

export const SEEDED_PORTAL_APPLICATIONS: CandidatePortalApplication[] = [
  {
    id: "capp-collins-1",
    reference: "CAN-2026-1001",
    studentId: COLLINS.studentId,
    candidateProfileId: "cprof-collins",
    electionId: ELECTION_2_ID,
    applicationType: "SAKU_COUNCIL",
    status: "Approved",
    currentStep: 5,
    campusId: COLLINS.campusId,
    schoolId: COLLINS.schoolId,
    departmentId: COLLINS.departmentId,
    programId: COLLINS.programId,
    electoralCollege: {
      kind: "DEPARTMENT",
      campusId: COLLINS.campusId,
      schoolId: COLLINS.schoolId,
      departmentId: COLLINS.departmentId,
      unitId: "unit-campus-ruaraka-school-ru-ptti-dept-ru-ptti-acad",
      label: "Ruaraka · KCAU Professional and Technical Training Institute · Academic Programmes Department",
      mappingStatus: "resolved",
    },
    councilPositionId: "pos-treasurer",
    photograph: seededPhoto,
    documents: [
      {
        id: "file-collins-statement",
        kind: "campaign-statement",
        filename: "campaign-statement.pdf",
        mimeType: "application/pdf",
        size: 24000,
        dataUrl: "data:application/pdf;base64,JVBERi0xLjAK",
        uploadedAt: now,
      },
    ],
    declarations: {
      informationAccurate: true,
      understandNotApproval: true,
      consentToProcessIdentity: true,
      acceptCandidateDeclaration: true,
    },
    outstandingRequirements: [],
    ballotParticipationStatus: "not_configured",
    submittedAt: "2026-09-14T09:10:00.000Z",
    decidedAt: "2026-09-16T11:00:00.000Z",
    decidedBy: "Electoral Commission",
    decisionNote: "Application approved. Ballot placement is a separate Commission configuration step.",
    createdAt: "2026-09-14T08:40:00.000Z",
    updatedAt: "2026-09-16T11:00:00.000Z",
  },
];

export const SEEDED_PORTAL_NOTIFICATIONS: PortalNotification[] = [
  {
    id: "pn-collins-1",
    studentId: COLLINS.studentId,
    title: "Application approved",
    body: "Your SAKU Council application CAN-2026-1001 is approved. This is not the same as being placed on a ballot.",
    createdAt: "2026-09-16T11:02:00.000Z",
    read: false,
    href: "/candidate/applications",
  },
  {
    id: "pn-collins-2",
    studentId: COLLINS.studentId,
    title: "Agent nomination is available",
    body: "You may invite election agents. An invitation does not accredit the agent.",
    createdAt: "2026-09-16T11:05:00.000Z",
    read: false,
    href: "/candidate/agents",
  },
];

export const DEMO_CANDIDATE_ACCOUNTS = SEED_PEOPLE.map((student) => ({
  studentId: student.studentId,
  fullName: student.fullName,
  nationalId: mockNationalId(student.studentId),
  phone: mockPhone(student.studentId),
  campusId: student.campusId,
  note:
    student.studentId === "24/01511"
      ? "Approved SAKU Council application — use to try agent nomination"
      : student.studentId === "24/01212"
        ? "Fresh Delegates Election application"
        : student.studentId === "24/03201"
          ? "Town campus-wide Electoral College"
          : student.studentId === "24/02102"
            ? "Western / Kisumu school grouping"
            : null,
}));

export const CABINET_CANDIDATES: CabinetCandidate[] = [
  { id: "cab-si-1", studentId: "24/03102", contestId: "special-interests", constitutionalOfficeId: "special-interest-secretary", fullName: "Jane Auma Otieno", photo: portraitDataUri("Jane Auma Otieno", 12), gender: "F", status: "approved" },
  { id: "cab-si-2", studentId: "24/03101", contestId: "special-interests", constitutionalOfficeId: "special-interest-secretary", fullName: "Mary Wanjiku Ndungu", photo: portraitDataUri("Mary Wanjiku Ndungu", 200), gender: "F", status: "approved" },
  { id: "cab-si-3", studentId: "24/01312", contestId: "special-interests", constitutionalOfficeId: "special-interest-secretary", fullName: "Aisha Ali Mohamed", photo: portraitDataUri("Aisha Ali Mohamed", 330), gender: "F", status: "approved" },
  { id: "cab-sp-1", studentId: "24/01311", contestId: "sports", constitutionalOfficeId: "sports-entertainment-secretary", fullName: "Daniel Mutiso Wambua", photo: portraitDataUri("Daniel Mutiso Wambua", 200), gender: "M", status: "approved" },
  { id: "cab-sp-2", studentId: "24/02201", contestId: "sports", constitutionalOfficeId: "sports-entertainment-secretary", fullName: "Sharon Akinyi Ouma", photo: portraitDataUri("Sharon Akinyi Ouma", 18), gender: "F", status: "approved" },
  { id: "cab-sp-3", studentId: "24/02301", contestId: "sports", constitutionalOfficeId: "sports-entertainment-secretary", fullName: "Peter Njoroge Kamau", photo: portraitDataUri("Peter Njoroge Kamau", 140), gender: "M", status: "approved" },
  { id: "cab-ac-1", studentId: "24/02101", contestId: "academic", constitutionalOfficeId: "academic-secretary", fullName: "Faith Wambui Gitau", photo: portraitDataUri("Faith Wambui Gitau", 190), gender: "F", status: "approved" },
  { id: "cab-ac-2", studentId: "24/02102", contestId: "academic", constitutionalOfficeId: "academic-secretary", fullName: "Kevin Ochieng Okoth", photo: portraitDataUri("Kevin Ochieng Okoth", 25), gender: "M", status: "approved" },
  { id: "cab-ac-3", studentId: "24/01501", contestId: "academic", constitutionalOfficeId: "academic-secretary", fullName: "Naomi Cherono Bett", photo: portraitDataUri("Naomi Cherono Bett", 280), gender: "F", status: "approved" },
  { id: "cab-tr-1", studentId: "24/01512", contestId: "treasurer", constitutionalOfficeId: "treasurer", fullName: "Sarah Wanjiku Njeri", photo: portraitDataUri("Sarah Wanjiku Njeri", 40), gender: "F", status: "approved" },
  { id: "cab-tr-2", studentId: "24/01401", contestId: "treasurer", constitutionalOfficeId: "treasurer", fullName: "Lilian Muthoni Kariuki", photo: portraitDataUri("Lilian Muthoni Kariuki", 280), gender: "F", status: "approved" },
  { id: "cab-tr-3", studentId: "24/01503", contestId: "treasurer", constitutionalOfficeId: "treasurer", fullName: "Irene Akinyi Owino", photo: portraitDataUri("Irene Akinyi Owino", 210), gender: "F", status: "approved" },
  { id: "cab-sg-1", studentId: "24/01302", contestId: "secretary-general", constitutionalOfficeId: "secretary-general", fullName: "Cynthia Wairimu Njoroge", photo: portraitDataUri("Cynthia Wairimu Njoroge", 40), gender: "F", status: "approved" },
  { id: "cab-sg-2", studentId: "24/01301", contestId: "secretary-general", constitutionalOfficeId: "secretary-general", fullName: "Brian Kiptoo Cheruiyot", photo: portraitDataUri("Brian Kiptoo Cheruiyot", 265), gender: "M", status: "approved" },
  { id: "cab-sg-3", studentId: "24/03301", contestId: "secretary-general", constitutionalOfficeId: "secretary-general", fullName: "Esther Nyambura Waweru", photo: portraitDataUri("Esther Nyambura Waweru", 160), gender: "F", status: "approved" },
  {
    id: "cab-pr-1",
    studentId: "24/01203",
    contestId: "president-ticket",
    constitutionalOfficeId: "chairperson-ticket",
    fullName: "Janet Njeri Wambui",
    photo: portraitDataUri("Janet Njeri Wambui", 32),
    gender: "F",
    runningMateStudentId: "24/01202",
    runningMateName: "Peter Otieno Odhiambo",
    runningMatePhoto: portraitDataUri("Peter Otieno Odhiambo", 18),
    runningMateGender: "M",
    ticketLabel: "Unity Ticket",
    status: "approved",
  },
  {
    id: "cab-pr-2",
    studentId: "24/01313",
    contestId: "president-ticket",
    constitutionalOfficeId: "chairperson-ticket",
    fullName: "Samuel Kariuki Maina",
    photo: portraitDataUri("Samuel Kariuki Maina", 210),
    gender: "M",
    runningMateStudentId: "24/01312",
    runningMateName: "Aisha Ali Mohamed",
    runningMatePhoto: portraitDataUri("Aisha Ali Mohamed", 330),
    runningMateGender: "F",
    ticketLabel: "Progress Ticket",
    status: "approved",
  },
];

function emptyStation(
  id: string,
  name: string,
  campus: string,
  campusId: string,
  code: string,
): PollingStation {
  return {
    id,
    name,
    campus,
    campusId,
    code,
    status: "NOT_READY",
    votesCast: 0,
    networkAuthorized: true,
    serverReady: true,
    readiness: {
      votingPcs: false,
      votingArea: false,
      materials: false,
      prepared: false,
    },
    frozen: false,
    frozenAt: null,
    frozenReason: null,
    openedAt: null,
    openedBy: null,
    closedAt: null,
    closedBy: null,
    closingNote: null,
  };
}

export const POLLING_STATIONS: PollingStation[] = [
  emptyStation("ps-ruaraka", "Ruaraka Polling Station", "Ruaraka", "campus-ruaraka", "RU-01"),
  emptyStation("ps-town", "Town Polling Station", "Town", "campus-town", "TN-01"),
  emptyStation("ps-kitengela", "Kitengela Polling Station", "Kitengela", "campus-kitengela", "KT-01"),
  emptyStation("ps-western", "Western Polling Station", "Western", "campus-western", "WE-01"),
];

export function createInitialAssignments(): AssignmentRecord[] {
  return COMMISSION_MEMBERS.filter((member) => member.pollingStationIds.length === 1).map(
    (member) => ({
      id: `asg-${member.id}`,
      memberId: member.id,
      stationId: member.pollingStationIds[0],
      assignedBy: "Prof. Amina Wanjiku",
      assignedAt: "2026-09-08T09:00:00.000Z",
      active: true,
      endedAt: null,
      endedBy: null,
    }),
  );
}

function emptyElection(
  id: string,
  contest: "ELECTION_1_DELEGATE" | "SAKU_LEADERSHIP",
  name: string,
  shortName: string,
  date: string,
) {
  return {
    id,
    cycleId: CYCLE_ID,
    name,
    shortName,
    year: 2026,
    stage: "REGISTRATION" as const,
    contest,
    electionDate: date,
    startTime: "08:00",
    endTime: "18:00",
    votingMethod: "ELECTRONIC" as const,
    emergencyStatus: "RUNNING" as const,
    openedAt: null,
    closedAt: null,
    closedBy: null,
    closingNote: null,
    closingExceptionUsed: false,
    resultsWorkflow: "NOT_STARTED" as const,
    resultsAuthorizedAt: null,
    resultsAuthorizedBy: null,
    createdAt: now,
    updatedAt: now,
  };
}

export function createInitialStore(): AppStore {
  const units = createElectoralUnits(ELECTION_1_ID);
  const election1 = emptyElection(
    ELECTION_1_ID,
    "ELECTION_1_DELEGATE",
    "Election 1 — Delegates Election",
    "Delegates 2026",
    "2026-09-22",
  );
  const election2 = emptyElection(
    ELECTION_2_ID,
    "SAKU_LEADERSHIP",
    "Election 2 — SAKU Council Election",
    "Council 2026",
    "2026-09-29",
  );
  const delegateApplications = buildDelegateApplications(DELEGATE_CANDIDATES);
  const councilApplications = buildCouncilApplications();
  const voterPortal = buildVoterPortalSeed();

  return {
    version: STORE_VERSION,
    cycleId: CYCLE_ID,
    election: election1,
    elections: [election1, election2],
    activeElectionContext: "ELECTION_1",
    pollingStations: POLLING_STATIONS,
    candidates: [
      {
        id: "cand-01",
        fullName: "Janet Njeri Wambui",
        ticket: "Unity Ticket",
        position: "President",
        campus: "Ruaraka",
        status: "approved",
        photo: portraitDataUri("Janet Njeri Wambui", 32),
        reviewedBy: "Prof. Amina Wanjiku",
        reviewedAt: "2026-09-10T11:20:00.000Z",
      },
      {
        id: "cand-02",
        fullName: "Samuel Kariuki Maina",
        ticket: "Progress Ticket",
        position: "President",
        campus: "Ruaraka",
        status: "approved",
        photo: portraitDataUri("Samuel Kariuki Maina", 210),
        reviewedBy: "Prof. Amina Wanjiku",
        reviewedAt: "2026-09-10T11:24:00.000Z",
      },
      {
        id: "cand-03",
        fullName: "Cynthia Wairimu Njoroge",
        ticket: "Unity Ticket",
        position: "Secretary General",
        campus: "Ruaraka",
        status: "pending",
        photo: portraitDataUri("Cynthia Wairimu Njoroge", 40),
      },
      {
        id: "cand-04",
        fullName: "Collins Mwenda Mutua",
        ticket: "Independent",
        position: "Treasurer / Finance Secretary",
        campus: "Ruaraka",
        status: "pending",
        photo: portraitDataUri("Collins Mwenda Mutua", 40),
      },
      {
        id: "cand-05",
        fullName: "Faith Wambui Gitau",
        ticket: "Progress Ticket",
        position: "Academic Secretary",
        campus: "Western",
        status: "pending",
        photo: portraitDataUri("Faith Wambui Gitau", 190),
      },
    ],
    voterRegister: {
      version: "VR-2026-03",
      status: "submitted",
      voterCount: STUDENT_ELECTORS.length,
      submittedAt: "2026-09-12T16:00:00.000Z",
      approvedAt: null,
      approvedBy: null,
    },
    stationElectionState: POLLING_STATIONS.flatMap((station) =>
      [ELECTION_1_ID, ELECTION_2_ID].map((electionId) => ({
        electionId,
        stationId: station.id,
        status: "NOT_READY" as const,
        votesCast: 0,
        readiness: station.readiness,
        frozen: false,
        openedAt: null,
        openedBy: null,
        closedAt: null,
        closedBy: null,
        closingNote: null,
      })),
    ),
    notifications: [
      {
        id: "n-1",
        title: "DEMO MODE — MOCK DATA ONLY",
        body: "This prototype uses interconnected mock records. No live ERP, fee-clearance or SMS gateway is connected.",
        createdAt: now,
        read: false,
        href: "/commission/election",
        audience: "all",
      },
      {
        id: "n-2",
        title: "Voter register awaits approval",
        body: "The mock first-year Election 1 register has been loaded and needs Commission approval.",
        createdAt: "2026-09-17T14:12:00.000Z",
        read: false,
        href: "/commission/voters",
        audience: ["CHAIR", "VICE_CHAIR", "SECRETARY_GENERAL"],
      },
      {
        id: "n-3",
        title: "Emergency control is restricted",
        body: "Pause and resume require Chair and Vice Chair two-person authorization.",
        createdAt: "2026-09-16T10:00:00.000Z",
        read: false,
        href: "/commission/emergency",
        audience: ["CHAIR", "VICE_CHAIR"],
      },
    ],
    auditLog: [
      {
        id: "a-1",
        at: "2026-09-08T09:00:00.000Z",
        actorWorkId: "KCAU-EC-001",
        actorName: "Prof. Amina Wanjiku",
        action: "assign_polling_stations",
        detail: "Assigned four station commissioners to Ruaraka, Town, Kitengela, and Western.",
        highRisk: false,
      },
    ],
    campuses: CAMPUSES,
    schools: SCHOOLS,
    departments: DEPARTMENTS,
    programmes: PROGRAMMES,
    electoralUnits: units,
    studentElectors: STUDENT_ELECTORS,
    studentMappings: STUDENT_MAPPINGS,
    candidateApplications: [...delegateApplications, ...councilApplications],
    candidateLocks: [
      { electionId: ELECTION_1_ID, status: "CONFIRMED", lockedAt: null, lockedBy: null },
      { electionId: ELECTION_2_ID, status: "DRAFT", lockedAt: null, lockedBy: null },
    ],
    delegateCandidates: DELEGATE_CANDIDATES,
    delegateVotes: [],
    electedDelegates: [],
    electoralCollege: {
      electionId: ELECTION_2_ID,
      sourceElectionId: ELECTION_1_ID,
      version: 0,
      status: "not_generated",
      generatedAt: null,
      verifiedAt: null,
      verifiedBy: null,
      approvedAt: null,
      approvedBy: null,
      entries: [],
    },
    electoralCollegeHistory: [],
    cabinetCandidates: CABINET_CANDIDATES,
    cabinetDrafts: [],
    cabinetVotes: [],
    agents: buildAgents(),
    agentAttendance: [],
    agentObservations: [
      {
        id: "obs-ru-001",
        agentId: "agent-003",
        stationId: "ps-ruaraka",
        body: "Independent agent observation of the same Ruaraka queue crowding. Original agent wording preserved.",
        createdAt: "2026-09-22T08:55:00.000Z",
        linkedIncidentId: "inc-ru-agent",
      },
      {
        id: "obs-tn-001",
        agentId: "agent-001",
        stationId: "ps-town",
        body: "Agent observation: campaign material was visible near the Town station entrance and was later removed.",
        createdAt: "2026-09-22T09:36:00.000Z",
        linkedIncidentId: "inc-tn-agent",
      },
    ],
    voterExceptions: buildVoterExceptions(),
    voterProfiles: voterPortal.profiles,
    voterHistory: voterPortal.history,
    voterNotifications: voterPortal.notifications,
    academicCorrectionRequests: voterPortal.corrections,
    identityDocumentPolicy: DEFAULT_IDENTITY_DOCUMENT_POLICY,
    accessibilityReadiness: POLLING_STATIONS.map((station) => ({
      campusId: station.campusId,
      stationId: station.id,
      preparedCount: 0,
      outstandingCount: STUDENT_ELECTORS.filter(
        (student) => student.campusId === station.campusId && student.accessibility.declared,
      ).length,
      notes: "Station accommodation preparation is pending the assigned Commissioner.",
      updatedAt: now,
    })),
    resultsByElection: [
      { electionId: ELECTION_1_ID, workflow: "NOT_STARTED", generatedAt: null, totals: [], discrepancies: [], authorizedBy: null, declaredAt: null, publishedAt: null },
      { electionId: ELECTION_2_ID, workflow: "NOT_STARTED", generatedAt: null, totals: [], discrepancies: [], authorizedBy: null, declaredAt: null, publishedAt: null },
    ],
    namingDiscrepancies: [
      {
        officeId: "chairperson-ticket",
        note: "The 2021 Constitution uses Chairperson and Vice Chairperson. This prototype still displays President and Vice President pending Commission resolution before any live election.",
      },
      {
        officeId: "treasurer",
        note: "The Constitution uses Treasurer. This prototype still displays Treasurer / Finance Secretary.",
      },
      {
        officeId: "special-interest-secretary",
        note: "The Constitution uses Special Interest Secretary. This prototype still displays Special Interests Secretary.",
      },
    ],
    policyFlags: [
      {
        id: "election-wide-close-authority",
        topic: "Election-wide closing authorisation",
        status: "needs_confirmation",
        detail: "Chair and Vice Chair currently hold the prototype election-wide close action. The Commission’s formal closing procedure has not been supplied.",
      },
      {
        id: "tie-procedure",
        topic: "Election 1 ties",
        status: "needs_confirmation",
        detail: "No approved procedure was supplied for ties that affect the final three delegate places. Tied outcomes are flagged for Commission review.",
      },
      {
        id: "abstention",
        topic: "Blank ballots",
        status: "needs_confirmation",
        detail: "The current prototype requires a selection before NEXT or submission. Formal abstention rules are pending Commission confirmation.",
      },
      {
        id: "grand-total-42",
        topic: "Delegate seat grand total",
        status: "needs_confirmation",
        detail: SEAT_REVIEW_NOTE,
      },
      {
        id: "western-unit-level",
        topic: "Western / Kisumu electoral-unit mapping",
        status: "needs_confirmation",
        detail: "Part 1 refers to department-based Electoral Colleges at Western. The signed academic reference lists Western schools without departments, so this prototype maps three school-level units and does not invent departments.",
      },
      {
        id: "identity-document-policy",
        topic: "Voter identity documents",
        status: "needs_confirmation",
        detail: "Only Kenyan National ID is enabled for the Voter Portal prototype. An alternative-document policy has not been supplied and is not invented here.",
      },
    ],
    assignments: createInitialAssignments(),
    incidents: buildIncidents(),
    emergencies: [],
    notices: [],
    disputes: [],
    studentIdentities: STUDENT_IDENTITIES,
    candidateProfiles: SEEDED_CANDIDATE_PROFILES,
    candidatePortalApplications: SEEDED_PORTAL_APPLICATIONS,
    agentNominations: [],
    correctionRequests: [],
    portalNotifications: SEEDED_PORTAL_NOTIFICATIONS,
    portalConfig: DEFAULT_PORTAL_CONFIG,
    structuralAudit: [
      {
        id: "sa-1",
        at: now,
        actorWorkId: "SYSTEM",
        actorName: "ORBIS prototype seed",
        entity: "electoral_unit",
        entityId: CONFIG_VERSION,
        field: "delegateSeats",
        oldValue: "UNCONFIGURED",
        newValue: "3",
        reason: SEAT_SOURCE,
        electionId: ELECTION_1_ID,
        configurationVersionId: CONFIG_VERSION,
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

export function findCommissionMemberById(id: string) {
  return COMMISSION_MEMBERS.find((member) => member.id === id) ?? null;
}
