import { portraitDataUri } from "@/lib/portraits";
import type {
  AppStore,
  AssignmentRecord,
  CabinetCandidate,
  Campus,
  CommissionMember,
  DelegateCandidate,
  ElectoralDepartment,
  ElectoralUnitConfiguration,
  InstitutionalUser,
  PollingStation,
  Programme,
  School,
  StudentElector,
  StudentElectoralMapping,
} from "@/lib/types";
import { STORE_VERSION } from "@/lib/types";

export { DEMO_ACCOUNTS, DEMO_PASSWORD } from "@/lib/demo-accounts";

const DEMO_PASSWORD_HASH =
  "$2b$10$7Ty1982sTG6WMko6.C9kHuJztfZpyfErzjvdxqoHiZYBL4O7B4u8.";

const now = "2026-09-18T08:00:00.000Z";

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
    electionId: ELECTION_ID,
    pollingStationIds: [],
    active: true,
  },
  {
    id: "member-vice",
    userId: "user-vice",
    role: "VICE_CHAIR",
    electionId: ELECTION_ID,
    pollingStationIds: [],
    active: true,
  },
  {
    id: "member-sg",
    userId: "user-sg",
    role: "SECRETARY_GENERAL",
    electionId: ELECTION_ID,
    pollingStationIds: [],
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
    userId: "user-com-western",
    role: "COMMISSIONER",
    electionId: ELECTION_ID,
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
  stamp({ id: "campus-ruaraka", name: "Ruaraka", code: "RU", status: "active" }),
  stamp({ id: "campus-western", name: "Western", code: "WE", status: "active" }),
  stamp({ id: "campus-town", name: "Town", code: "TN", status: "active" }),
  stamp({ id: "campus-kitengela", name: "Kitengela", code: "KT", status: "active" }),
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

function unitId(campusId: string, schoolId: string, departmentId?: string | null) {
  return `unit-${[campusId, schoolId, departmentId ?? "school"].join("-")}`;
}

export function createElectoralUnits(electionId: string): ElectoralUnitConfiguration[] {
  const units: ElectoralUnitConfiguration[] = [];

  for (const school of SCHOOLS) {
    const departments = DEPARTMENTS.filter((dept) => dept.schoolId === school.id);
    if (departments.length === 0) {
      units.push(
        stamp({
          id: unitId(school.campusId, school.id),
          electionId,
          campusId: school.campusId,
          schoolId: school.id,
          departmentId: null,
          programId: null,
          delegateSeats: null,
          seatStatus: "UNCONFIGURED",
          status: "active",
        }),
      );
      continue;
    }
    for (const department of departments) {
      units.push(
        stamp({
          id: unitId(school.campusId, school.id, department.id),
          electionId,
          campusId: school.campusId,
          schoolId: school.id,
          departmentId: department.id,
          programId: null,
          delegateSeats: null,
          seatStatus: "UNCONFIGURED",
          status: "active",
        }),
      );
    }
  }

  return units;
}

type StudentSeed = {
  studentId: string;
  fullName: string;
  campusId: string;
  schoolId: string;
  departmentId: string | null;
};

const STUDENT_SEEDS: StudentSeed[] = [
  { studentId: "24/01201", fullName: "Ann Wanjiru Kamau", campusId: "campus-ruaraka", schoolId: "school-ru-bus", departmentId: "dept-ru-bus-bam" },
  { studentId: "24/01202", fullName: "Peter Otieno Odhiambo", campusId: "campus-ruaraka", schoolId: "school-ru-bus", departmentId: "dept-ru-bus-bam" },
  { studentId: "24/01211", fullName: "Grace Njeri Mwangi", campusId: "campus-ruaraka", schoolId: "school-ru-bus", departmentId: "dept-ru-bus-af" },
  { studentId: "24/01212", fullName: "Ian Kiprono Langat", campusId: "campus-ruaraka", schoolId: "school-ru-bus", departmentId: "dept-ru-bus-af" },
  { studentId: "24/01221", fullName: "Mercy Chebet Rono", campusId: "campus-ruaraka", schoolId: "school-ru-bus", departmentId: "dept-ru-bus-es" },
  { studentId: "24/01301", fullName: "Brian Kiptoo Cheruiyot", campusId: "campus-ruaraka", schoolId: "school-ru-tech", departmentId: "dept-ru-tech-sdis" },
  { studentId: "24/01302", fullName: "Cynthia Wairimu Njoroge", campusId: "campus-ruaraka", schoolId: "school-ru-tech", departmentId: "dept-ru-tech-sdis" },
  { studentId: "24/01311", fullName: "Daniel Mutiso Wambua", campusId: "campus-ruaraka", schoolId: "school-ru-tech", departmentId: "dept-ru-tech-nac" },
  { studentId: "24/01312", fullName: "Aisha Ali Mohamed", campusId: "campus-ruaraka", schoolId: "school-ru-tech", departmentId: "dept-ru-tech-nac" },
  { studentId: "24/01313", fullName: "Samuel Kariuki Maina", campusId: "campus-ruaraka", schoolId: "school-ru-tech", departmentId: "dept-ru-tech-nac" },
  { studentId: "24/01401", fullName: "Lilian Muthoni Kariuki", campusId: "campus-ruaraka", schoolId: "school-ru-eass", departmentId: "dept-ru-eass-eps" },
  { studentId: "24/01411", fullName: "James Odhiambo Otieno", campusId: "campus-ruaraka", schoolId: "school-ru-eass", departmentId: "dept-ru-eass-pafmes" },
  { studentId: "24/01501", fullName: "Naomi Cherono Bett", campusId: "campus-ruaraka", schoolId: "school-ru-ptti", departmentId: "dept-ru-ptti-pro" },
  { studentId: "24/01511", fullName: "Collins Mwenda Mutua", campusId: "campus-ruaraka", schoolId: "school-ru-ptti", departmentId: "dept-ru-ptti-acad" },
  { studentId: "24/02101", fullName: "Faith Wambui Gitau", campusId: "campus-western", schoolId: "school-we-tech", departmentId: null },
  { studentId: "24/02102", fullName: "Kevin Ochieng Okoth", campusId: "campus-western", schoolId: "school-we-tech", departmentId: null },
  { studentId: "24/02201", fullName: "Sharon Akinyi Ouma", campusId: "campus-western", schoolId: "school-we-bus", departmentId: null },
  { studentId: "24/02301", fullName: "Peter Njoroge Kamau", campusId: "campus-western", schoolId: "school-we-ptti", departmentId: null },
  { studentId: "24/03101", fullName: "Mary Wanjiku Ndungu", campusId: "campus-town", schoolId: "school-tn-bus", departmentId: null },
  { studentId: "24/03102", fullName: "Jane Auma Otieno", campusId: "campus-town", schoolId: "school-tn-bus", departmentId: null },
  { studentId: "24/03201", fullName: "Joseph Mwangi Karanja", campusId: "campus-town", schoolId: "school-tn-tech", departmentId: null },
  { studentId: "24/03301", fullName: "Esther Nyambura Waweru", campusId: "campus-town", schoolId: "school-tn-eass", departmentId: null },
  { studentId: "24/03401", fullName: "Hassan Abdi Noor", campusId: "campus-town", schoolId: "school-tn-ptti", departmentId: null },
  { studentId: "24/04101", fullName: "Rebecca Chepkoech", campusId: "campus-kitengela", schoolId: "school-kt-bus", departmentId: null },
  { studentId: "24/04201", fullName: "Tony Kipchirchir", campusId: "campus-kitengela", schoolId: "school-kt-tech", departmentId: null },
  { studentId: "24/04301", fullName: "Agnes Achieng Onyango", campusId: "campus-kitengela", schoolId: "school-kt-ptti", departmentId: null },
];

export const STUDENT_ELECTORS: StudentElector[] = STUDENT_SEEDS.map((student) =>
  stamp({
    id: `st-${student.studentId.replace("/", "-")}`,
    studentId: student.studentId,
    fullName: student.fullName,
    yearOfStudy: 1,
    campusId: student.campusId,
    schoolId: student.schoolId,
    departmentId: student.departmentId,
    programId: null,
    eligibilityStatus: "eligible",
    eligibilitySource: "mock_first_year_register",
    voterStatus: "not_voted",
  }),
);

export const STUDENT_MAPPINGS: StudentElectoralMapping[] = STUDENT_SEEDS.map((student) =>
  stamp({
    studentId: student.studentId,
    electionId: ELECTION_ID,
    campusId: student.campusId,
    schoolId: student.schoolId,
    departmentId: student.departmentId,
    programId: null,
    eligibilityStatus: "eligible",
    eligibilitySource: "mock_first_year_register",
  }),
);

const DELEGATE_SEEDS: { studentId: string; hue: number }[] = [
  { studentId: "24/01201", hue: 210 },
  { studentId: "24/01202", hue: 18 },
  { studentId: "24/01211", hue: 160 },
  { studentId: "24/01301", hue: 265 },
  { studentId: "24/01302", hue: 40 },
  { studentId: "24/01311", hue: 200 },
  { studentId: "24/01312", hue: 330 },
  { studentId: "24/01313", hue: 120 },
  { studentId: "24/01401", hue: 280 },
  { studentId: "24/02101", hue: 190 },
  { studentId: "24/02102", hue: 25 },
  { studentId: "24/03101", hue: 350 },
  { studentId: "24/03102", hue: 80 },
  { studentId: "24/04101", hue: 145 },
  { studentId: "24/04201", hue: 300 },
];

export const DELEGATE_CANDIDATES: DelegateCandidate[] = DELEGATE_SEEDS.map((item, index) => {
  const student = STUDENT_SEEDS.find((row) => row.studentId === item.studentId)!;
  return stamp({
    id: `del-${String(index + 1).padStart(2, "0")}`,
    studentId: student.studentId,
    electionId: ELECTION_ID,
    fullName: student.fullName,
    photo: portraitDataUri(student.fullName, item.hue),
    campusId: student.campusId,
    schoolId: student.schoolId,
    departmentId: student.departmentId,
    candidateType: "DELEGATE",
    approvalStatus: "approved",
    votesReceived: 0,
    status: "active",
  });
});

export const CABINET_CANDIDATES: CabinetCandidate[] = [
  { id: "cab-si-1", contestId: "special-interests", fullName: "Jane Auma Otieno", photo: portraitDataUri("Jane Auma Otieno", 12), status: "approved" },
  { id: "cab-si-2", contestId: "special-interests", fullName: "Mary Wanjiku Ndungu", photo: portraitDataUri("Mary Wanjiku Ndungu", 200), status: "approved" },
  { id: "cab-si-3", contestId: "special-interests", fullName: "Aisha Ali Mohamed", photo: portraitDataUri("Aisha Ali Mohamed", 330), status: "approved" },
  { id: "cab-sp-1", contestId: "sports", fullName: "Daniel Mutiso Wambua", photo: portraitDataUri("Daniel Mutiso Wambua", 200), status: "approved" },
  { id: "cab-sp-2", contestId: "sports", fullName: "Sharon Akinyi Ouma", photo: portraitDataUri("Sharon Akinyi Ouma", 18), status: "approved" },
  { id: "cab-sp-3", contestId: "sports", fullName: "Peter Njoroge Kamau", photo: portraitDataUri("Peter Njoroge Kamau", 140), status: "approved" },
  { id: "cab-ac-1", contestId: "academic", fullName: "Faith Wambui Gitau", photo: portraitDataUri("Faith Wambui Gitau", 190), status: "approved" },
  { id: "cab-ac-2", contestId: "academic", fullName: "Kevin Ochieng Okoth", photo: portraitDataUri("Kevin Ochieng Okoth", 25), status: "approved" },
  { id: "cab-ac-3", contestId: "academic", fullName: "Naomi Cherono Bett", photo: portraitDataUri("Naomi Cherono Bett", 280), status: "approved" },
  { id: "cab-tr-1", contestId: "treasurer", fullName: "Collins Mwenda Mutua", photo: portraitDataUri("Collins Mwenda Mutua", 40), status: "approved" },
  { id: "cab-tr-2", contestId: "treasurer", fullName: "Lilian Muthoni Kariuki", photo: portraitDataUri("Lilian Muthoni Kariuki", 280), status: "approved" },
  { id: "cab-tr-3", contestId: "treasurer", fullName: "James Odhiambo Otieno", photo: portraitDataUri("James Odhiambo Otieno", 210), status: "approved" },
  { id: "cab-sg-1", contestId: "secretary-general", fullName: "Cynthia Wairimu Njoroge", photo: portraitDataUri("Cynthia Wairimu Njoroge", 40), status: "approved" },
  { id: "cab-sg-2", contestId: "secretary-general", fullName: "Brian Kiptoo Cheruiyot", photo: portraitDataUri("Brian Kiptoo Cheruiyot", 265), status: "approved" },
  { id: "cab-sg-3", contestId: "secretary-general", fullName: "Esther Nyambura Waweru", photo: portraitDataUri("Esther Nyambura Waweru", 160), status: "approved" },
  {
    id: "cab-pr-1",
    contestId: "president-ticket",
    fullName: "Janet Njeri Wambui",
    photo: portraitDataUri("Janet Njeri Wambui", 32),
    runningMateName: "Mercy Chebet Rono",
    runningMatePhoto: portraitDataUri("Mercy Chebet Rono", 150),
    ticketLabel: "Unity Ticket",
    status: "approved",
  },
  {
    id: "cab-pr-2",
    contestId: "president-ticket",
    fullName: "Samuel Kariuki Maina",
    photo: portraitDataUri("Samuel Kariuki Maina", 210),
    runningMateName: "Aisha Ali Mohamed",
    runningMatePhoto: portraitDataUri("Aisha Ali Mohamed", 330),
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
    openedAt: null,
    openedBy: null,
    closedAt: null,
    closedBy: null,
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

export function createInitialStore(): AppStore {
  const units = createElectoralUnits(ELECTION_ID);

  return {
    version: STORE_VERSION,
    election: {
      id: ELECTION_ID,
      name: "SAKU Student Elections 2026",
      shortName: "SAKU 2026",
      year: 2026,
      stage: "REGISTRATION",
      contest: "ELECTION_1_DELEGATE",
      electionDate: "2026-09-22",
      startTime: "08:00",
      endTime: "18:00",
      votingMethod: "ELECTRONIC",
      emergencyStatus: "RUNNING",
      openedAt: null,
      closedAt: null,
      resultsAuthorizedAt: null,
      resultsAuthorizedBy: null,
      createdAt: now,
      updatedAt: now,
    },
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
    notifications: [
      {
        id: "n-1",
        title: "Seat allocation is required",
        body: "Delegate seats are unconfigured for every electoral unit. Do not invent a default number.",
        createdAt: now,
        read: false,
        href: "/commission/election/election-1?tab=structure",
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
    delegateCandidates: DELEGATE_CANDIDATES,
    delegateVotes: [],
    electedDelegates: [],
    electoralCollege: {
      electionId: ELECTION_ID,
      status: "not_generated",
      generatedAt: null,
      verifiedAt: null,
      verifiedBy: null,
      entries: [],
    },
    cabinetCandidates: CABINET_CANDIDATES,
    cabinetDrafts: [],
    cabinetVotes: [],
    assignments: createInitialAssignments(),
    incidents: [],
    emergencies: [],
    notices: [],
    disputes: [],
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
