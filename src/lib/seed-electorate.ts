import { last4, mockNationalId, mockPhone as voterMockPhone } from "@/lib/identity";
import { portraitDataUri } from "@/lib/portraits";
import { attachMockIdentity, mockPhone } from "@/lib/student-identity";
import type {
  AccessibilityCategory,
  AcademicCorrectionRequest,
  AgentInvitation,
  AgentNotification,
  AgentRecord,
  CandidateApplication,
  DelegateCandidate,
  Election2VoterStatus,
  IncidentRecord,
  ObservationInstruction,
  StudentElector,
  StudentElectoralMapping,
  VoterException,
  VoterHistoryEvent,
  VoterNotification,
  VoterProfile,
  VoterRegistrationStatus,
} from "@/lib/types";

export const CYCLE_ID = "saku-2026";
export const ELECTION_1_ID = "saku-2026-e1";
export const ELECTION_2_ID = "saku-2026-e2";
export const CONFIG_VERSION = "const-2021-art-5.1.2-memo-2023-08-17";
export const SEAT_SOURCE =
  "SAKU Constitution Art. 5.1.2(8)–(10) applied to the signed 17 August 2023 academic departments memo";
export const SEAT_REVIEW_NOTE =
  "Each Electoral College elects three representatives. The grand total of 42 is calculated from 14 configured colleges × 3; no separate signed schedule stating 42 was supplied.";

const now = "2026-09-18T08:00:00.000Z";
const DEMO_PASSWORD_HASH =
  "$2b$10$7Ty1982sTG6WMko6.C9kHuJztfZpyfErzjvdxqoHiZYBL4O7B4u8.";

export type SeedPerson = {
  studentId: string;
  fullName: string;
  gender: StudentElector["gender"];
  campusId: string;
  schoolId: string;
  departmentId: string | null;
  candidate?: boolean;
  accessibility?: {
    categories: AccessibilityCategory[];
    accommodations: string[];
    notes: string;
  };
};

export const SEED_PEOPLE: SeedPerson[] = [
  { studentId: "24/01201", fullName: "Ann Wanjiru Kamau", gender: "F", campusId: "campus-ruaraka", schoolId: "school-ru-bus", departmentId: "dept-ru-bus-bam", candidate: true },
  { studentId: "24/01202", fullName: "Peter Otieno Odhiambo", gender: "M", campusId: "campus-ruaraka", schoolId: "school-ru-bus", departmentId: "dept-ru-bus-bam", candidate: true },
  { studentId: "24/01203", fullName: "Janet Njeri Wambui", gender: "F", campusId: "campus-ruaraka", schoolId: "school-ru-bus", departmentId: "dept-ru-bus-bam", candidate: true },
  { studentId: "24/01204", fullName: "George Mwangi Njoroge", gender: "M", campusId: "campus-ruaraka", schoolId: "school-ru-bus", departmentId: "dept-ru-bus-bam" },
  { studentId: "24/01211", fullName: "Grace Njeri Mwangi", gender: "F", campusId: "campus-ruaraka", schoolId: "school-ru-bus", departmentId: "dept-ru-bus-af", candidate: true, accessibility: { categories: ["visual"], accommodations: ["Audio assistance", "Large text"], notes: "Prefers headphone audio guidance." } },
  { studentId: "24/01212", fullName: "Ian Kiprono Langat", gender: "M", campusId: "campus-ruaraka", schoolId: "school-ru-bus", departmentId: "dept-ru-bus-af", candidate: true },
  { studentId: "24/01213", fullName: "Purity Atieno Oduor", gender: "F", campusId: "campus-ruaraka", schoolId: "school-ru-bus", departmentId: "dept-ru-bus-af", candidate: true },
  { studentId: "24/01221", fullName: "Mercy Chebet Rono", gender: "F", campusId: "campus-ruaraka", schoolId: "school-ru-bus", departmentId: "dept-ru-bus-es", candidate: true },
  { studentId: "24/01222", fullName: "David Kimani Waweru", gender: "M", campusId: "campus-ruaraka", schoolId: "school-ru-bus", departmentId: "dept-ru-bus-es", candidate: true },
  { studentId: "24/01223", fullName: "Halima Hassan Juma", gender: "F", campusId: "campus-ruaraka", schoolId: "school-ru-bus", departmentId: "dept-ru-bus-es", candidate: true },
  { studentId: "24/01301", fullName: "Brian Kiptoo Cheruiyot", gender: "M", campusId: "campus-ruaraka", schoolId: "school-ru-tech", departmentId: "dept-ru-tech-sdis", candidate: true },
  { studentId: "24/01302", fullName: "Cynthia Wairimu Njoroge", gender: "F", campusId: "campus-ruaraka", schoolId: "school-ru-tech", departmentId: "dept-ru-tech-sdis", candidate: true },
  { studentId: "24/01303", fullName: "Felix Omondi Otieno", gender: "M", campusId: "campus-ruaraka", schoolId: "school-ru-tech", departmentId: "dept-ru-tech-sdis", candidate: true },
  { studentId: "24/01311", fullName: "Daniel Mutiso Wambua", gender: "M", campusId: "campus-ruaraka", schoolId: "school-ru-tech", departmentId: "dept-ru-tech-nac", candidate: true },
  { studentId: "24/01312", fullName: "Aisha Ali Mohamed", gender: "F", campusId: "campus-ruaraka", schoolId: "school-ru-tech", departmentId: "dept-ru-tech-nac", candidate: true },
  { studentId: "24/01313", fullName: "Samuel Kariuki Maina", gender: "M", campusId: "campus-ruaraka", schoolId: "school-ru-tech", departmentId: "dept-ru-tech-nac", candidate: true },
  { studentId: "24/01401", fullName: "Lilian Muthoni Kariuki", gender: "F", campusId: "campus-ruaraka", schoolId: "school-ru-eass", departmentId: "dept-ru-eass-eps", candidate: true },
  { studentId: "24/01402", fullName: "Mark Otieno Onyango", gender: "M", campusId: "campus-ruaraka", schoolId: "school-ru-eass", departmentId: "dept-ru-eass-eps", candidate: true },
  { studentId: "24/01403", fullName: "Beatrice Chepkemoi", gender: "F", campusId: "campus-ruaraka", schoolId: "school-ru-eass", departmentId: "dept-ru-eass-eps", candidate: true },
  { studentId: "24/01411", fullName: "James Odhiambo Otieno", gender: "M", campusId: "campus-ruaraka", schoolId: "school-ru-eass", departmentId: "dept-ru-eass-pafmes", candidate: true },
  { studentId: "24/01412", fullName: "Ruth Nyambura Mwangi", gender: "F", campusId: "campus-ruaraka", schoolId: "school-ru-eass", departmentId: "dept-ru-eass-pafmes", candidate: true },
  { studentId: "24/01413", fullName: "Victor Kipchoge Rotich", gender: "M", campusId: "campus-ruaraka", schoolId: "school-ru-eass", departmentId: "dept-ru-eass-pafmes", candidate: true },
  { studentId: "24/01501", fullName: "Naomi Cherono Bett", gender: "F", campusId: "campus-ruaraka", schoolId: "school-ru-ptti", departmentId: "dept-ru-ptti-pro", candidate: true },
  { studentId: "24/01502", fullName: "Henry Kamau Gitau", gender: "M", campusId: "campus-ruaraka", schoolId: "school-ru-ptti", departmentId: "dept-ru-ptti-pro", candidate: true },
  { studentId: "24/01503", fullName: "Irene Akinyi Owino", gender: "F", campusId: "campus-ruaraka", schoolId: "school-ru-ptti", departmentId: "dept-ru-ptti-pro", candidate: true },
  { studentId: "24/01511", fullName: "Collins Mwenda Mutua", gender: "M", campusId: "campus-ruaraka", schoolId: "school-ru-ptti", departmentId: "dept-ru-ptti-acad", candidate: true },
  { studentId: "24/01512", fullName: "Sarah Wanjiku Njeri", gender: "F", campusId: "campus-ruaraka", schoolId: "school-ru-ptti", departmentId: "dept-ru-ptti-acad", candidate: true },
  { studentId: "24/01513", fullName: "Paul Kiprono Bett", gender: "M", campusId: "campus-ruaraka", schoolId: "school-ru-ptti", departmentId: "dept-ru-ptti-acad", candidate: true },
  { studentId: "24/01901", fullName: "Joyce Wambui Kariuki", gender: "F", campusId: "campus-ruaraka", schoolId: "school-ru-bus", departmentId: null },
  { studentId: "24/02101", fullName: "Faith Wambui Gitau", gender: "F", campusId: "campus-western", schoolId: "school-we-tech", departmentId: null, candidate: true, accessibility: { categories: ["hearing"], accommodations: ["Visual instructions", "Captions"], notes: "Requests captioned guidance." } },
  { studentId: "24/02102", fullName: "Kevin Ochieng Okoth", gender: "M", campusId: "campus-western", schoolId: "school-we-tech", departmentId: null, candidate: true },
  { studentId: "24/02103", fullName: "Triza Adhiambo Otieno", gender: "F", campusId: "campus-western", schoolId: "school-we-tech", departmentId: null, candidate: true },
  { studentId: "24/02201", fullName: "Sharon Akinyi Ouma", gender: "F", campusId: "campus-western", schoolId: "school-we-bus", departmentId: null, candidate: true },
  { studentId: "24/02202", fullName: "Moses Odhiambo Onyango", gender: "M", campusId: "campus-western", schoolId: "school-we-bus", departmentId: null, candidate: true },
  { studentId: "24/02203", fullName: "Eunice Chebet Korir", gender: "F", campusId: "campus-western", schoolId: "school-we-bus", departmentId: null, candidate: true },
  { studentId: "24/02301", fullName: "Peter Njoroge Kamau", gender: "M", campusId: "campus-western", schoolId: "school-we-ptti", departmentId: null, candidate: true },
  { studentId: "24/02302", fullName: "Lydia Achieng Otieno", gender: "F", campusId: "campus-western", schoolId: "school-we-ptti", departmentId: null, candidate: true },
  { studentId: "24/02303", fullName: "Alex Kiprono Sang", gender: "M", campusId: "campus-western", schoolId: "school-we-ptti", departmentId: null, candidate: true },
  { studentId: "24/03101", fullName: "Mary Wanjiku Ndungu", gender: "F", campusId: "campus-town", schoolId: "school-tn-bus", departmentId: null, candidate: true, accessibility: { categories: ["mobility"], accommodations: ["Accessible polling area"], notes: "Requires accessible workstation." } },
  { studentId: "24/03102", fullName: "Jane Auma Otieno", gender: "F", campusId: "campus-town", schoolId: "school-tn-bus", departmentId: null, candidate: true },
  { studentId: "24/03201", fullName: "Joseph Mwangi Karanja", gender: "M", campusId: "campus-town", schoolId: "school-tn-tech", departmentId: null, candidate: true },
  { studentId: "24/03301", fullName: "Esther Nyambura Waweru", gender: "F", campusId: "campus-town", schoolId: "school-tn-eass", departmentId: null },
  { studentId: "24/03401", fullName: "Hassan Abdi Noor", gender: "M", campusId: "campus-town", schoolId: "school-tn-ptti", departmentId: null },
  { studentId: "24/04101", fullName: "Rebecca Chepkoech", gender: "F", campusId: "campus-kitengela", schoolId: "school-kt-bus", departmentId: null, candidate: true, accessibility: { categories: ["cognitive"], accommodations: ["Simplified instructions", "Additional processing time"], notes: "Prefers one instruction at a time." } },
  { studentId: "24/04201", fullName: "Tony Kipchirchir", gender: "M", campusId: "campus-kitengela", schoolId: "school-kt-tech", departmentId: null, candidate: true },
  { studentId: "24/04301", fullName: "Agnes Achieng Onyango", gender: "F", campusId: "campus-kitengela", schoolId: "school-kt-ptti", departmentId: null, candidate: true },
  { studentId: "24/04302", fullName: "Martin Wekesa Barasa", gender: "M", campusId: "campus-kitengela", schoolId: "school-kt-bus", departmentId: null, accessibility: { categories: ["visual", "mobility"], accommodations: ["Large text", "Accessible polling area"], notes: "Combined visual and mobility assistance." } },
  { studentId: "24/05101", fullName: "Caroline Njeri Otieno", gender: "F", campusId: "campus-town", schoolId: "school-tn-bus", departmentId: null },
  { studentId: "24/05102", fullName: "Dennis Kiprono Langat", gender: "M", campusId: "campus-ruaraka", schoolId: "school-ru-tech", departmentId: "dept-ru-tech-sdis" },
  { studentId: "24/05103", fullName: "Faith Achieng Odhiambo", gender: "F", campusId: "campus-ruaraka", schoolId: "school-ru-bus", departmentId: "dept-ru-bus-bam" },
  { studentId: "24/05104", fullName: "Brian Otieno Wekesa", gender: "M", campusId: "campus-kitengela", schoolId: "school-kt-bus", departmentId: null },
  { studentId: "24/05105", fullName: "Lucy Wanjiku Maina", gender: "F", campusId: "campus-western", schoolId: "school-we-bus", departmentId: null },
  { studentId: "24/05106", fullName: "Kevin Mutua Mwangi", gender: "M", campusId: "campus-town", schoolId: "school-tn-tech", departmentId: null },
  { studentId: "24/05107", fullName: "Pauline Chebet Kosgei", gender: "F", campusId: "campus-ruaraka", schoolId: "school-ru-eass", departmentId: "dept-ru-eass-eps" },
  { studentId: "24/05108", fullName: "Daniel Omondi Okello", gender: "M", campusId: "campus-kitengela", schoolId: "school-kt-tech", departmentId: null },
];

function emptyAccessibility(): StudentElector["accessibility"] {
  return {
    declared: false,
    categories: [],
    accommodations: [],
    notes: "",
    updatedAt: null,
    consentToShareOperationally: false,
  };
}

export function buildStudentElectors(): StudentElector[] {
  return SEED_PEOPLE.map((person) => {
    const nationalId = mockNationalId(person.studentId);
    const votedElection1 = person.studentId === "24/02101";
    const ineligibleVoter = person.studentId === "24/03401";
    return attachMockIdentity({
      id: `st-${person.studentId.replace("/", "-")}`,
      studentId: person.studentId,
      fullName: person.fullName,
      gender: person.gender,
      yearOfStudy: 1,
      campusId: person.campusId,
      schoolId: person.schoolId,
      departmentId: person.departmentId,
      programId: null,
      eligibilityStatus: ineligibleVoter ? "ineligible" : person.departmentId === null && person.campusId === "campus-ruaraka" ? "pending" : "eligible",
      eligibilitySource: "mock_first_year_register",
      election1Eligibility: ineligibleVoter ? "ineligible" : person.departmentId === null && person.campusId === "campus-ruaraka" ? "pending" : "eligible",
      election1VotingStatus: votedElection1 ? "voted" : "not_voted",
      electedDelegateStatus: "not_applicable",
      electoralCollegeEligibility: "not_applicable",
      election2Eligibility: "not_applicable",
      election2VotingStatus: "not_applicable",
      verificationStatus: "verified",
      courseLabel: undefined,
      phoneNumber: voterMockPhone(person.studentId),
      nationalIdLast4: last4(nationalId),
      voterStatus: votedElection1 ? "voted" : "not_voted",
      accessibility: person.accessibility
        ? {
            declared: true,
            categories: person.accessibility.categories,
            accommodations: person.accessibility.accommodations,
            notes: person.accessibility.notes,
            updatedAt: now,
            consentToShareOperationally: true,
          }
        : emptyAccessibility(),
      createdAt: now,
      updatedAt: now,
    });
  });
}

export function electoralUnitId(input: {
  campusId: string;
  schoolId: string | null;
  departmentId: string | null;
  unitKind: "DEPARTMENT" | "SCHOOL" | "CAMPUS_WIDE";
}) {
  if (input.unitKind === "CAMPUS_WIDE") return `unit-${input.campusId}-campus`;
  if (input.unitKind === "SCHOOL") return `unit-${input.campusId}-${input.schoolId}-school`;
  return `unit-${input.campusId}-${input.schoolId}-${input.departmentId}`;
}

export function buildStudentMappings(): StudentElectoralMapping[] {
  return SEED_PEOPLE.map((person) => {
    const unitKind =
      person.campusId === "campus-ruaraka"
        ? "DEPARTMENT"
        : person.campusId === "campus-western"
          ? "SCHOOL"
          : "CAMPUS_WIDE";
    return {
      studentId: person.studentId,
      electionId: ELECTION_1_ID,
      electoralUnitId: electoralUnitId({
        campusId: person.campusId,
        schoolId: person.schoolId,
        departmentId: person.departmentId,
        unitKind,
      }),
      campusId: person.campusId,
      schoolId: unitKind === "CAMPUS_WIDE" ? null : person.schoolId,
      departmentId: unitKind === "DEPARTMENT" ? person.departmentId : null,
      programId: null,
      eligibilityStatus: "eligible",
      eligibilitySource: "mock_first_year_register",
      createdAt: now,
      updatedAt: now,
    };
  });
}

function hueFrom(value: string) {
  return [...value].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 360;
}

export function buildDelegateCandidates(): DelegateCandidate[] {
  return SEED_PEOPLE.filter((person) => person.candidate).map((person, index) => ({
    id: `del-${String(index + 1).padStart(2, "0")}`,
    studentId: person.studentId,
    electionId: ELECTION_1_ID,
    fullName: person.fullName,
    photo: portraitDataUri(person.fullName, hueFrom(person.fullName)),
    campusId: person.campusId,
    schoolId: person.schoolId,
    departmentId: person.departmentId,
    candidateType: "DELEGATE",
    approvalStatus: "approved",
    votesReceived: 0,
    status: "active",
    createdAt: now,
    updatedAt: now,
  }));
}

export function buildDelegateApplications(delegates: DelegateCandidate[]): CandidateApplication[] {
  return delegates.map((candidate) => ({
    id: `app-${candidate.id}`,
    studentId: candidate.studentId,
    fullName: candidate.fullName,
    electionKind: "DELEGATE",
    electionId: ELECTION_1_ID,
    positionLabel: "Electoral College Delegate",
    electoralUnitId: electoralUnitId({
      campusId: candidate.campusId,
      schoolId: candidate.schoolId,
      departmentId: candidate.departmentId,
      unitKind:
        candidate.campusId === "campus-ruaraka"
          ? "DEPARTMENT"
          : candidate.campusId === "campus-western"
            ? "SCHOOL"
            : "CAMPUS_WIDE",
    }),
    photo: candidate.photo,
    applicationStatus: "UNDER_REVIEW",
    vettingStatus: "APPROVED",
    participationStatus: "SELECTED",
    verificationStatus: "VERIFIED",
    configurationStatus: "CONFIRMED",
    documents: [
      { id: `doc-${candidate.id}-1`, title: "Nomination form", reference: `NOM-${candidate.studentId}` },
    ],
    vettingNotes: "Mock prototype review. Live ERP, fee-clearance and disciplinary checks are suspended.",
    submittedAt: "2026-09-08T10:00:00.000Z",
    reviewedBy: "Prof. Amina Wanjiku",
    reviewedAt: "2026-09-10T11:00:00.000Z",
  }));
}

export function buildCouncilApplications(): CandidateApplication[] {
  const rows: Array<{
    id: string;
    studentId: string;
    positionLabel: string;
    contestId: CandidateApplication["contestId"];
    runningMateStudentId?: string;
    runningMateName?: string;
    vetting: CandidateApplication["vettingStatus"];
    participation: CandidateApplication["participationStatus"];
  }> = [
    { id: "app-cab-si-1", studentId: "24/03102", positionLabel: "Special Interests Secretary", contestId: "special-interests", vetting: "APPROVED", participation: "SELECTED" },
    { id: "app-cab-si-2", studentId: "24/03101", positionLabel: "Special Interests Secretary", contestId: "special-interests", vetting: "APPROVED", participation: "SELECTED" },
    { id: "app-cab-si-3", studentId: "24/01312", positionLabel: "Special Interests Secretary", contestId: "special-interests", vetting: "APPROVED", participation: "SELECTED" },
    { id: "app-cab-sp-1", studentId: "24/01311", positionLabel: "Sports & Entertainment Secretary", contestId: "sports", vetting: "APPROVED", participation: "SELECTED" },
    { id: "app-cab-sp-2", studentId: "24/02201", positionLabel: "Sports & Entertainment Secretary", contestId: "sports", vetting: "APPROVED", participation: "SELECTED" },
    { id: "app-cab-sp-3", studentId: "24/02301", positionLabel: "Sports & Entertainment Secretary", contestId: "sports", vetting: "APPROVED", participation: "SELECTED" },
    { id: "app-cab-ac-1", studentId: "24/02101", positionLabel: "Academic Secretary", contestId: "academic", vetting: "APPROVED", participation: "SELECTED" },
    { id: "app-cab-ac-2", studentId: "24/02102", positionLabel: "Academic Secretary", contestId: "academic", vetting: "APPROVED", participation: "SELECTED" },
    { id: "app-cab-ac-3", studentId: "24/01501", positionLabel: "Academic Secretary", contestId: "academic", vetting: "APPROVED", participation: "SELECTED" },
    { id: "app-cab-tr-1", studentId: "24/01512", positionLabel: "Treasurer / Finance Secretary", contestId: "treasurer", vetting: "APPROVED", participation: "SELECTED" },
    { id: "app-cab-tr-2", studentId: "24/01401", positionLabel: "Treasurer / Finance Secretary", contestId: "treasurer", vetting: "APPROVED", participation: "SELECTED" },
    { id: "app-cab-tr-3", studentId: "24/01503", positionLabel: "Treasurer / Finance Secretary", contestId: "treasurer", vetting: "APPROVED", participation: "SELECTED" },
    { id: "app-cab-tr-4", studentId: "24/01511", positionLabel: "Treasurer / Finance Secretary", contestId: "treasurer", vetting: "REJECTED", participation: "NOT_SELECTED" },
    { id: "app-cab-sg-1", studentId: "24/01302", positionLabel: "Secretary General", contestId: "secretary-general", vetting: "APPROVED", participation: "SELECTED" },
    { id: "app-cab-sg-2", studentId: "24/01301", positionLabel: "Secretary General", contestId: "secretary-general", vetting: "APPROVED", participation: "SELECTED" },
    { id: "app-cab-sg-3", studentId: "24/03301", positionLabel: "Secretary General", contestId: "secretary-general", vetting: "APPROVED", participation: "SELECTED" },
    {
      id: "app-cab-pr-1",
      studentId: "24/01203",
      positionLabel: "President + Vice President",
      contestId: "president-ticket",
      runningMateStudentId: "24/01202",
      runningMateName: "Peter Otieno Odhiambo",
      vetting: "APPROVED",
      participation: "SELECTED",
    },
    {
      id: "app-cab-pr-2",
      studentId: "24/01313",
      positionLabel: "President + Vice President",
      contestId: "president-ticket",
      runningMateStudentId: "24/01312",
      runningMateName: "Aisha Ali Mohamed",
      vetting: "APPROVED",
      participation: "SELECTED",
    },
  ];

  return rows.map((row) => {
    const person = SEED_PEOPLE.find((item) => item.studentId === row.studentId)!;
    return {
      id: row.id,
      studentId: row.studentId,
      fullName: person.fullName,
      electionKind: "COUNCIL" as const,
      electionId: ELECTION_2_ID,
      positionLabel: row.positionLabel,
      contestId: row.contestId,
      electoralUnitId: null,
      runningMateStudentId: row.runningMateStudentId ?? null,
      runningMateName: row.runningMateName ?? null,
      photo: portraitDataUri(person.fullName, hueFrom(person.fullName)),
      applicationStatus: row.vetting === "PENDING" ? "UNDER_REVIEW" : "UNDER_REVIEW",
      vettingStatus: row.vetting,
      participationStatus: row.participation,
      verificationStatus: row.participation === "SELECTED" ? "SENT" : "NOT_SENT",
      configurationStatus: "DRAFT",
      documents: [{ id: `${row.id}-nom`, title: "Council nomination", reference: `CN-${row.studentId}` }],
      vettingNotes:
        row.contestId === "treasurer"
          ? row.vetting === "REJECTED"
            ? "Rejected in mock review: Treasurer is reserved for women (2021 Constitution)."
            : "Constitutional Treasurer eligibility: office reserved for women. Mock review only."
          : "Mock prototype review. Live institutional checks are suspended.",
      submittedAt: "2026-09-09T09:00:00.000Z",
      reviewedBy: row.vetting === "APPROVED" ? "Prof. Amina Wanjiku" : null,
      reviewedAt: row.vetting === "APPROVED" ? "2026-09-11T10:00:00.000Z" : null,
    };
  });
}

function agentPhoto(studentId: string) {
  const person = SEED_PEOPLE.find((item) => item.studentId === studentId);
  return portraitDataUri(person?.fullName ?? studentId, hueFrom(studentId));
}

function seedAgent(input: {
  id: string;
  code: string;
  studentId: string;
  candidateApplicationId: string;
  candidateStudentId: string;
  candidateName: string;
  candidatePosition: string;
  accreditationStatus: AgentRecord["accreditationStatus"];
  applicationStatus: AgentRecord["applicationStatus"];
  invitationId: string;
  invitationReference: string;
  stationId: string;
  campusId: string;
  accreditedAt: string | null;
  accreditedBy: string | null;
  decisionNote?: string;
}): AgentRecord {
  const person = SEED_PEOPLE.find((item) => item.studentId === input.studentId)!;
  const accredited = input.accreditationStatus === "ACCREDITED";
  return {
    id: input.id,
    agentCode: input.code,
    studentId: input.studentId,
    fullName: person.fullName,
    registrationNumber: input.studentId,
    passwordHash: DEMO_PASSWORD_HASH,
    phone: mockPhone(person.studentId),
    phoneVerifiedAt: now,
    invitationId: input.invitationId,
    invitationReference: input.invitationReference,
    applicationReference: `AGA-${input.code.replace("AG-", "")}`,
    applicationStatus: input.applicationStatus,
    candidateApplicationId: input.candidateApplicationId,
    candidateStudentId: input.candidateStudentId,
    candidateName: input.candidateName,
    candidatePosition: input.candidatePosition,
    candidatePhoto: agentPhoto(input.candidateStudentId),
    electionId: ELECTION_2_ID,
    nominationStatus: accredited || input.applicationStatus !== "DRAFT" ? "ACTIVATED" : "NOMINATED",
    accreditationStatus: input.accreditationStatus,
    accreditationReference: accredited || input.accreditationStatus === "SUSPENDED" || input.accreditationStatus === "REVOKED"
      ? `ACC-${input.code}`
      : null,
    requestedCampusId: input.campusId,
    requestedStationId: input.stationId,
    assignedCampusId: accredited || input.accreditationStatus === "SUSPENDED" ? input.campusId : null,
    assignedStationId: accredited || input.accreditationStatus === "SUSPENDED" ? input.stationId : null,
    permittedStationIds: accredited || input.accreditationStatus === "SUSPENDED" ? [input.stationId] : [],
    accessInstructions: accredited
      ? "Check in only at your assigned campus polling station on an authorised Commission computer. Do not vote, campaign or handle ballots."
      : "Station access is granted only after the Electoral Commission accredits this application.",
    conductAcknowledged: true,
    accuracyConfirmed: true,
    privacyAcknowledged: true,
    correctionRequest: null,
    correctionRequestAt: null,
    submittedAt: now,
    accreditedAt: input.accreditedAt,
    accreditedBy: input.accreditedBy,
    decisionNote: input.decisionNote ?? null,
    createdAt: now,
    updatedAt: now,
  };
}

export function buildAgents(): AgentRecord[] {
  return [
    seedAgent({
      id: "agent-001",
      code: "AG-001",
      studentId: "24/05101",
      candidateApplicationId: "app-cab-si-1",
      candidateStudentId: "24/03102",
      candidateName: "Jane Auma Otieno",
      candidatePosition: "Special Interests Secretary",
      accreditationStatus: "ACCREDITED",
      applicationStatus: "APPROVED",
      invitationId: "inv-used-001",
      invitationReference: "INV-USED-2N6R",
      stationId: "ps-town",
      campusId: "campus-town",
      accreditedAt: "2026-09-14T12:00:00.000Z",
      accreditedBy: "Prof. Amina Wanjiku",
    }),
    seedAgent({
      id: "agent-002",
      code: "AG-002",
      studentId: "24/05102",
      candidateApplicationId: "app-cab-sg-1",
      candidateStudentId: "24/01302",
      candidateName: "Cynthia Wairimu Njoroge",
      candidatePosition: "Secretary General",
      accreditationStatus: "PENDING",
      applicationStatus: "SUBMITTED",
      invitationId: "inv-pending-002",
      invitationReference: "INV-PND-3C8Q",
      stationId: "ps-ruaraka",
      campusId: "campus-ruaraka",
      accreditedAt: null,
      accreditedBy: null,
    }),
    seedAgent({
      id: "agent-003",
      code: "AG-003",
      studentId: "24/05103",
      candidateApplicationId: "app-cab-pr-2",
      candidateStudentId: "24/01313",
      candidateName: "Samuel Kariuki Maina",
      candidatePosition: "President + Vice President",
      accreditationStatus: "ACCREDITED",
      applicationStatus: "APPROVED",
      invitationId: "inv-used-003",
      invitationReference: "INV-USED-8M4K",
      stationId: "ps-ruaraka",
      campusId: "campus-ruaraka",
      accreditedAt: "2026-09-14T12:10:00.000Z",
      accreditedBy: "Dr. David Omondi",
    }),
    seedAgent({
      id: "agent-004",
      code: "AG-004",
      studentId: "24/05104",
      candidateApplicationId: "app-cab-sp-1",
      candidateStudentId: "24/01311",
      candidateName: "Daniel Mutiso Wambua",
      candidatePosition: "Sports & Entertainment Secretary",
      accreditationStatus: "SUSPENDED",
      applicationStatus: "APPROVED",
      invitationId: "inv-used-004",
      invitationReference: "INV-USED-5T7B",
      stationId: "ps-kitengela",
      campusId: "campus-kitengela",
      accreditedAt: "2026-09-14T12:20:00.000Z",
      accreditedBy: "Prof. Amina Wanjiku",
      decisionNote: "Temporarily suspended pending a station-conduct review. Observation access is withdrawn.",
    }),
    seedAgent({
      id: "agent-005",
      code: "AG-005",
      studentId: "24/05105",
      candidateApplicationId: "app-cab-ac-1",
      candidateStudentId: "24/02101",
      candidateName: "Faith Wambui Gitau",
      candidatePosition: "Academic Secretary",
      accreditationStatus: "REVOKED",
      applicationStatus: "REJECTED",
      invitationId: "inv-used-005",
      invitationReference: "INV-USED-1H9D",
      stationId: "ps-western",
      campusId: "campus-western",
      accreditedAt: "2026-09-14T12:30:00.000Z",
      accreditedBy: "Prof. Amina Wanjiku",
      decisionNote: "Accreditation revoked. This agent may not observe or report for the remainder of the election.",
    }),
  ];
}

function invitation(input: {
  id: string;
  reference: string;
  candidateApplicationId: string;
  candidateStudentId: string;
  candidateName: string;
  candidatePosition: string;
  invitedStudentId: string;
  status: AgentInvitation["status"];
  expiresAt: string;
  usedAt?: string | null;
  usedByApplicationId?: string | null;
  revokedAt?: string | null;
  revokedReason?: string | null;
}): AgentInvitation {
  const invited = SEED_PEOPLE.find((item) => item.studentId === input.invitedStudentId);
  return {
    id: input.id,
    reference: input.reference,
    candidateApplicationId: input.candidateApplicationId,
    candidateStudentId: input.candidateStudentId,
    candidateName: input.candidateName,
    candidatePosition: input.candidatePosition,
    candidatePhoto: agentPhoto(input.candidateStudentId),
    electionId: ELECTION_2_ID,
    invitedStudentId: input.invitedStudentId,
    invitedFullName: invited?.fullName ?? input.invitedStudentId,
    status: input.status,
    expiresAt: input.expiresAt,
    createdAt: "2026-09-12T09:00:00.000Z",
    usedAt: input.usedAt ?? null,
    usedByApplicationId: input.usedByApplicationId ?? null,
    revokedAt: input.revokedAt ?? null,
    revokedReason: input.revokedReason ?? null,
  };
}

export function buildAgentInvitations(): AgentInvitation[] {
  return [
    invitation({
      id: "inv-used-001",
      reference: "INV-USED-2N6R",
      candidateApplicationId: "app-cab-si-1",
      candidateStudentId: "24/03102",
      candidateName: "Jane Auma Otieno",
      candidatePosition: "Special Interests Secretary",
      invitedStudentId: "24/05101",
      status: "USED",
      expiresAt: "2026-12-31T23:59:00.000Z",
      usedAt: now,
      usedByApplicationId: "agent-001",
    }),
    invitation({
      id: "inv-open-006",
      reference: "INV-OPEN-7K2M",
      candidateApplicationId: "app-cab-si-1",
      candidateStudentId: "24/03102",
      candidateName: "Jane Auma Otieno",
      candidatePosition: "Special Interests Secretary",
      invitedStudentId: "24/05106",
      status: "OPEN",
      expiresAt: "2026-12-31T23:59:00.000Z",
    }),
    invitation({
      id: "inv-pending-002",
      reference: "INV-PND-3C8Q",
      candidateApplicationId: "app-cab-sg-1",
      candidateStudentId: "24/01302",
      candidateName: "Cynthia Wairimu Njoroge",
      candidatePosition: "Secretary General",
      invitedStudentId: "24/05102",
      status: "USED",
      expiresAt: "2026-12-31T23:59:00.000Z",
      usedAt: now,
      usedByApplicationId: "agent-002",
    }),
    invitation({
      id: "inv-used-003",
      reference: "INV-USED-8M4K",
      candidateApplicationId: "app-cab-pr-2",
      candidateStudentId: "24/01313",
      candidateName: "Samuel Kariuki Maina",
      candidatePosition: "President + Vice President",
      invitedStudentId: "24/05103",
      status: "USED",
      expiresAt: "2026-12-31T23:59:00.000Z",
      usedAt: now,
      usedByApplicationId: "agent-003",
    }),
    invitation({
      id: "inv-used-004",
      reference: "INV-USED-5T7B",
      candidateApplicationId: "app-cab-sp-1",
      candidateStudentId: "24/01311",
      candidateName: "Daniel Mutiso Wambua",
      candidatePosition: "Sports & Entertainment Secretary",
      invitedStudentId: "24/05104",
      status: "USED",
      expiresAt: "2026-12-31T23:59:00.000Z",
      usedAt: now,
      usedByApplicationId: "agent-004",
    }),
    invitation({
      id: "inv-used-005",
      reference: "INV-USED-1H9D",
      candidateApplicationId: "app-cab-ac-1",
      candidateStudentId: "24/02101",
      candidateName: "Faith Wambui Gitau",
      candidatePosition: "Academic Secretary",
      invitedStudentId: "24/05105",
      status: "USED",
      expiresAt: "2026-12-31T23:59:00.000Z",
      usedAt: now,
      usedByApplicationId: "agent-005",
    }),
    invitation({
      id: "inv-exp-007",
      reference: "INV-EXP-9Q1C",
      candidateApplicationId: "app-cab-sg-1",
      candidateStudentId: "24/01302",
      candidateName: "Cynthia Wairimu Njoroge",
      candidatePosition: "Secretary General",
      invitedStudentId: "24/05107",
      status: "EXPIRED",
      expiresAt: "2026-09-01T08:00:00.000Z",
    }),
    invitation({
      id: "inv-rev-008",
      reference: "INV-REV-4H8P",
      candidateApplicationId: "app-cab-pr-2",
      candidateStudentId: "24/01313",
      candidateName: "Samuel Kariuki Maina",
      candidatePosition: "President + Vice President",
      invitedStudentId: "24/05108",
      status: "REVOKED",
      expiresAt: "2026-12-31T23:59:00.000Z",
      revokedAt: "2026-09-16T10:00:00.000Z",
      revokedReason: "Candidate withdrew this nomination before the student applied.",
    }),
    invitation({
      id: "inv-unav-009",
      reference: "INV-UNAV-5D3W",
      candidateApplicationId: "app-cab-si-1",
      candidateStudentId: "24/03102",
      candidateName: "Jane Auma Otieno",
      candidatePosition: "Special Interests Secretary",
      invitedStudentId: "24/03401",
      status: "UNAVAILABLE",
      expiresAt: "2026-12-31T23:59:00.000Z",
    }),
    invitation({
      id: "inv-open-01204",
      reference: "INV-OPEN-8P4T",
      candidateApplicationId: "app-cab-tr-1",
      candidateStudentId: "24/01512",
      candidateName: "Sarah Wanjiku Njeri",
      candidatePosition: "Treasurer / Finance Secretary",
      invitedStudentId: "24/01204",
      status: "OPEN",
      expiresAt: "2026-12-31T23:59:00.000Z",
    }),
  ];
}

export function buildAgentNotifications(): AgentNotification[] {
  return [
    {
      id: "an-001",
      agentId: "agent-001",
      studentId: "24/05101",
      title: "Accreditation approved",
      body: "The Electoral Commission accredited you to observe for Jane Auma Otieno at Town Polling Station.",
      href: "/agent/accreditation",
      createdAt: "2026-09-14T12:05:00.000Z",
      read: false,
      kind: "accreditation",
    },
    {
      id: "an-002",
      agentId: "agent-001",
      studentId: "24/05101",
      title: "Station assignment",
      body: "You are authorised to observe at Town Polling Station only.",
      href: "/agent/station",
      createdAt: "2026-09-14T12:06:00.000Z",
      read: false,
      kind: "station",
    },
    {
      id: "an-003",
      agentId: "agent-001",
      studentId: "24/05101",
      title: "Report received",
      body: "Your Town station observation AGT-TN-001 has been received by the Commission.",
      href: "/agent/reports",
      createdAt: "2026-09-22T09:36:00.000Z",
      read: false,
      kind: "report",
    },
    {
      id: "an-004",
      agentId: "agent-002",
      studentId: "24/05102",
      title: "Application received",
      body: "Your agent application AGA-002 is with the Electoral Commission. Accreditation is not automatic.",
      href: "/agent/accreditation",
      createdAt: now,
      read: false,
      kind: "application",
    },
    {
      id: "an-005",
      agentId: "agent-004",
      studentId: "24/05104",
      title: "Accreditation suspended",
      body: "Your accreditation has been suspended. Observation and check-in access is withdrawn until the Commission decides otherwise.",
      href: "/agent/accreditation",
      createdAt: "2026-09-20T08:00:00.000Z",
      read: false,
      kind: "accreditation",
    },
    {
      id: "an-006",
      agentId: "agent-005",
      studentId: "24/05105",
      title: "Accreditation revoked",
      body: "Your accreditation was revoked. You cannot observe or submit reports for this election.",
      href: "/agent/accreditation",
      createdAt: "2026-09-20T08:10:00.000Z",
      read: false,
      kind: "accreditation",
    },
    {
      id: "an-007",
      agentId: "",
      studentId: "24/05106",
      title: "You have been nominated",
      body: "Jane Auma Otieno nominated you as an election agent. Use invitation INV-OPEN-7K2M in the Agent Portal.",
      href: "/agent/register",
      createdAt: "2026-09-12T09:05:00.000Z",
      read: false,
      kind: "invitation",
    },
  ];
}

export function buildObservationInstructions(): ObservationInstruction[] {
  return [
    {
      id: "ins-conduct",
      title: "Agent Code of Conduct",
      summary: "What accredited agents may and may not do at a polling station.",
      body: [
        "Accredited election agents observe on behalf of an approved SAKU Council candidate.",
        "You may be present at your assigned polling station, record observations, and report irregularities to the Electoral Commission.",
        "You must not campaign, canvass, handle ballots, assist a voter to choose, or interfere with Commission officers.",
        "You must not photograph voter screens, voter identities, or completed ballots.",
        "A nomination or an application does not make you accredited. Only a Commission decision does.",
      ].join("\n\n"),
      publishedAt: "2026-09-10T08:00:00.000Z",
      downloadName: "saku-agent-code-of-conduct.txt",
    },
    {
      id: "ins-station",
      title: "Polling-station observation procedure",
      summary: "Arrival, check-in, and how to raise a concern without disrupting voting.",
      body: [
        "Arrive at the assigned campus polling station with your student ID.",
        "Check in through this portal only when you are physically at the authorised station.",
        "Stay in the designated observation area. Do not enter the voting booth or operator desk.",
        "If you see an irregularity, record it as an observation or incident report. Do not attempt to stop the election yourself.",
        "Check out when you leave the station so the attendance record stays accurate.",
      ].join("\n\n"),
      publishedAt: "2026-09-10T08:05:00.000Z",
      downloadName: "saku-agent-station-procedure.txt",
    },
    {
      id: "ins-reporting",
      title: "Incident reporting guide",
      summary: "How to describe what you saw so the Commission can review it.",
      body: [
        "State the time, the station, and what you observed in plain language.",
        "Attach a photograph or short video only of the surroundings or materials — never of a voter or a ballot face.",
        "Submitting a report does not classify, escalate or close the Commission record. Those decisions belong to the Commission.",
        "You can track whether your own report was received, is under review, needs more information, or has been closed.",
        "You cannot see other agents’ reports or internal Commission discussions.",
      ].join("\n\n"),
      publishedAt: "2026-09-10T08:10:00.000Z",
      downloadName: "saku-agent-incident-reporting.txt",
    },
  ];
}

export function buildVoterExceptions(): VoterException[] {
  return [
    {
      id: "exc-001",
      reference: "EXC-2026-001",
      studentId: null,
      fullName: "Michael Otieno Were",
      registrationNumber: "24/09901",
      campusId: "campus-town",
      issue: "MISSING_FROM_REGISTER",
      reason: "Student presented at Town station. Not on the mock first-year register.",
      verificationSource: "Requires institutional/Commission decision. Not a finance assumption.",
      status: "PENDING",
      submittedByWorkId: "KCAU-EC-005",
      submittedByName: "Ms. Faith Chebet",
      submittedAt: "2026-09-17T09:40:00.000Z",
      assignedReviewer: "Ms. Grace Mutiso",
      decisionNote: null,
      decidedBy: null,
      decidedAt: null,
      documents: [{ id: "exc-001-d1", title: "Student ID photograph", reference: "DOC-EXC-001" }],
    },
    {
      id: "exc-002",
      reference: "EXC-2026-002",
      studentId: "24/03201",
      fullName: "Joseph Mwangi Karanja",
      registrationNumber: "24/03201",
      campusId: "campus-town",
      issue: "RECORD_MISMATCH",
      reason: "Name on presented ID uses a hyphenated family name not stored on the mock record.",
      verificationSource: "Commission review of mock student record.",
      status: "MORE_INFO",
      submittedByWorkId: "KCAU-EC-005",
      submittedByName: "Ms. Faith Chebet",
      submittedAt: "2026-09-17T11:05:00.000Z",
      assignedReviewer: "Ms. Grace Mutiso",
      decisionNote: "Request supporting documentation. Do not independently declare eligible.",
      decidedBy: null,
      decidedAt: null,
      documents: [],
    },
  ];
}

export function buildIncidents(): IncidentRecord[] {
  const ruarakaId = "inc-ru-booth";
  return [
    {
      id: ruarakaId,
      electionId: ELECTION_1_ID,
      stationId: "ps-ruaraka",
      reportedByWorkId: "KCAU-EC-004",
      reportedByName: "Mr. Kevin Otieno",
      reporterRole: "COMMISSIONER",
      reporterKind: "commission",
      category: "process",
      description: "Queue crowding at the Ruaraka ballot booths. Station layout was adjusted and the area was re-marked.",
      occurredAt: "2026-09-22T08:42:00.000Z",
      recordedAt: "2026-09-22T08:50:00.000Z",
      status: "reviewed",
      evidence: [
        {
          id: "ev-ru-1",
          filename: "ruaraka-queue.jpg",
          mimeType: "image/jpeg",
          storedName: "ruaraka-queue.jpg",
          reference: "EVD-INC-RU-001-1",
          kind: "photograph",
          uploadedAt: "2026-09-22T08:51:00.000Z",
          uploadedBy: "Mr. Kevin Otieno",
        },
      ],
      reference: "INC-RU-001",
    },
    {
      id: "inc-ru-agent",
      electionId: ELECTION_1_ID,
      stationId: "ps-ruaraka",
      reportedByWorkId: "AG-003",
      reportedByName: "Faith Achieng Odhiambo",
      reporterRole: "AGENT",
      reporterKind: "agent",
      agentId: "agent-003",
      linkedIncidentId: ruarakaId,
      category: "process",
      description: "Independent agent observation of the same Ruaraka queue crowding. Original agent wording preserved.",
      occurredAt: "2026-09-22T08:44:00.000Z",
      recordedAt: "2026-09-22T08:55:00.000Z",
      status: "open",
      evidence: [
        {
          id: "ev-ru-ag-1",
          filename: "agent-queue-clip.mp4",
          mimeType: "video/mp4",
          storedName: "agent-queue-clip.mp4",
          reference: "EVD-AGT-RU-001-1",
          kind: "video",
          uploadedAt: "2026-09-22T08:56:00.000Z",
          uploadedBy: "Faith Achieng Odhiambo",
        },
      ],
      reference: "AGT-RU-001",
    },
    {
      id: "inc-tn-pc",
      electionId: ELECTION_1_ID,
      stationId: "ps-town",
      reportedByWorkId: "KCAU-EC-005",
      reportedByName: "Ms. Faith Chebet",
      reporterRole: "COMMISSIONER",
      reporterKind: "commission",
      category: "technical",
      description: "One voting PC at Town restarted. No ballot was accepted during the restart. Counter remained at the previous value.",
      occurredAt: "2026-09-22T09:10:00.000Z",
      recordedAt: "2026-09-22T09:18:00.000Z",
      status: "open",
      evidence: [],
      reference: "INC-TN-001",
    },
    {
      id: "inc-tn-agent",
      electionId: ELECTION_1_ID,
      stationId: "ps-town",
      reportedByWorkId: "AG-001",
      reportedByName: "Caroline Njeri Otieno",
      reporterRole: "AGENT",
      reporterKind: "agent",
      agentId: "agent-001",
      category: "conduct",
      description: "Agent observation: campaign material was visible near the Town station entrance and was later removed.",
      occurredAt: "2026-09-22T09:30:00.000Z",
      recordedAt: "2026-09-22T09:36:00.000Z",
      status: "open",
      evidence: [
        {
          id: "ev-tn-ag-1",
          filename: "town-entrance.jpg",
          mimeType: "image/jpeg",
          storedName: "town-entrance.jpg",
          reference: "EVD-AGT-TN-001-1",
          kind: "photograph",
          uploadedAt: "2026-09-22T09:37:00.000Z",
          uploadedBy: "Caroline Njeri Otieno",
        },
      ],
      reference: "AGT-TN-001",
    },
    {
      id: "inc-kt-access",
      electionId: ELECTION_1_ID,
      stationId: "ps-kitengela",
      reportedByWorkId: "KCAU-EC-006",
      reportedByName: "Mr. Brian Mwangi",
      reporterRole: "COMMISSIONER",
      reporterKind: "commission",
      category: "security",
      description: "Unauthorised person approached the Kitengela restricted area and was redirected. No ballots were affected.",
      occurredAt: "2026-09-22T10:05:00.000Z",
      recordedAt: "2026-09-22T10:12:00.000Z",
      status: "escalated",
      escalationNote: "Referred to Legal & Disputes. The system does not adjudicate.",
      evidence: [],
      reference: "INC-KT-001",
    },
    {
      id: "inc-we-conduct",
      electionId: ELECTION_1_ID,
      stationId: "ps-western",
      reportedByWorkId: "KCAU-EC-007",
      reportedByName: "Ms. Lydia Achieng",
      reporterRole: "COMMISSIONER",
      reporterKind: "commission",
      category: "conduct",
      description: "Loud campaigning reported outside Western station. The area was cleared. Voting continued.",
      occurredAt: "2026-09-22T10:40:00.000Z",
      recordedAt: "2026-09-22T10:48:00.000Z",
      status: "open",
      evidence: [],
      reference: "INC-WE-001",
    },
  ];
}

type PortalSeed = {
  studentId: string;
  status: VoterRegistrationStatus;
  step?: number;
  phoneVerified?: boolean;
  unitPending?: boolean;
  reference?: string;
  rejectionReason?: string | null;
  election2?: Election2VoterStatus | null;
  submittedAt?: string | null;
};

const PORTAL_SEEDS: PortalSeed[] = [
  { studentId: "24/01211", status: "APPROVED_ELIGIBLE", phoneVerified: true, reference: "VR-2026-A12F11", election2: "AWAITING_DELEGATE_OUTCOME" },
  { studentId: "24/01301", status: "PENDING_VERIFICATION", phoneVerified: true, reference: "VR-2026-B13C01" },
  { studentId: "24/01401", status: "REQUIRES_CORRECTION", phoneVerified: true, reference: "VR-2026-C14D01" },
  { studentId: "24/02101", status: "APPROVED_ELIGIBLE", phoneVerified: true, reference: "VR-2026-D21E01", election2: "AWAITING_DELEGATE_OUTCOME" },
  { studentId: "24/03401", status: "REJECTED", phoneVerified: true, reference: "VR-2026-E34F01", rejectionReason: "Authorized mock review recorded a rejection. This student cannot self-approve eligibility." },
  { studentId: "24/03301", status: "VERIFIED", phoneVerified: true, reference: "VR-2026-F33A01" },
  { studentId: "24/04302", status: "APPROVED_ELIGIBLE", phoneVerified: true, reference: "VR-2026-G43B02" },
  { studentId: "24/03101", status: "APPROVED_ELIGIBLE", phoneVerified: true, reference: "VR-2026-H31C01", election2: "ELIGIBLE_DELEGATE" },
  { studentId: "24/01201", status: "APPROVED_ELIGIBLE", phoneVerified: true, reference: "VR-2026-I12D01", election2: "NOT_ELECTED" },
  { studentId: "24/01202", status: "APPROVED_ELIGIBLE", phoneVerified: true, reference: "VR-2026-J12E02", election2: "PENDING_CONFIRMATION" },
  { studentId: "24/04101", status: "APPROVED_ELIGIBLE", phoneVerified: true, reference: "VR-2026-K41F01", election2: "UNDER_REVIEW" },
  { studentId: "24/01901", status: "APPROVED_ELIGIBLE", phoneVerified: true, reference: "VR-2026-L19G01", unitPending: true },
  { studentId: "24/01313", status: "DRAFT", step: 3, phoneVerified: true },
];

function historyFor(studentId: string, rows: Array<{ kind: VoterHistoryEvent["kind"]; title: string; detail: string; at?: string }>): VoterHistoryEvent[] {
  return rows.map((row, index) => ({
    id: `vh-${studentId.replace("/", "-")}-${index + 1}`,
    studentId,
    kind: row.kind,
    title: row.title,
    detail: row.detail,
    at: row.at ?? now,
  }));
}

export function buildVoterPortalSeed(): {
  profiles: VoterProfile[];
  history: VoterHistoryEvent[];
  notifications: VoterNotification[];
  corrections: AcademicCorrectionRequest[];
} {
  const people = new Map(SEED_PEOPLE.map((person) => [person.studentId, person]));
  const profiles: VoterProfile[] = PORTAL_SEEDS.map((seed) => {
    const person = people.get(seed.studentId)!;
    const submitted = seed.status !== "DRAFT";
    return {
      id: `vp-${seed.studentId.replace("/", "-")}`,
      studentId: seed.studentId,
      registrationReference: seed.reference ?? null,
      registrationStatus: seed.status,
      registrationDate: submitted ? "2026-09-16T09:00:00.000Z" : null,
      submittedAt: submitted ? (seed.submittedAt ?? "2026-09-16T09:00:00.000Z") : null,
      phoneNumber: voterMockPhone(seed.studentId),
      phoneVerifiedAt: seed.phoneVerified === false ? null : "2026-09-16T08:40:00.000Z",
      identityDocumentType: "NATIONAL_ID",
      identityDocumentLast4: last4(mockNationalId(seed.studentId)),
      electoralUnitId: seed.unitPending ? null : electoralUnitId({
        campusId: person.campusId,
        schoolId: person.schoolId,
        departmentId: person.departmentId,
        unitKind:
          person.campusId === "campus-ruaraka"
            ? "DEPARTMENT"
            : person.campusId === "campus-western"
              ? "SCHOOL"
              : "CAMPUS_WIDE",
      }),
      electoralUnitPending: Boolean(seed.unitPending),
      simulatedElection2Status: seed.election2 ?? null,
      draftStep: seed.step ?? (submitted ? 5 : 1),
      rejectionReason: seed.rejectionReason ?? null,
      createdAt: "2026-09-15T12:00:00.000Z",
      updatedAt: now,
    };
  });

  const history: VoterHistoryEvent[] = [
    ...historyFor("24/01211", [
      { kind: "REGISTRATION_STARTED", title: "Registration started", detail: "Student identity matched the shared student record." },
      { kind: "PHONE_VERIFIED", title: "Phone verified", detail: "A simulated OTP confirmed the mobile number on file." },
      { kind: "ACADEMIC_VERIFIED", title: "Academic information verified", detail: "Campus, school and department were taken from the student record." },
      { kind: "REGISTRATION_SUBMITTED", title: "Registration submitted", detail: "Reference VR-2026-A12F11 was issued." },
      { kind: "ELIGIBILITY_DECISION", title: "Approved as eligible elector", detail: "A mock Commission decision approved Election 1 eligibility. Ballot choices are not recorded here." },
      { kind: "ACCESSIBILITY_UPDATED", title: "Accessibility preferences saved", detail: "Visual assistance preferences were saved with operational consent." },
    ]),
    ...historyFor("24/02101", [
      { kind: "REGISTRATION_SUBMITTED", title: "Registration submitted", detail: "Reference VR-2026-D21E01 was issued." },
      { kind: "ELIGIBILITY_DECISION", title: "Approved as eligible elector", detail: "Mock verification approved Election 1 eligibility." },
      { kind: "ELECTION1_PARTICIPATION", title: "Election 1 participation updated", detail: "Participation status changed to Vote Cast. Candidate selections are not stored in this history." },
    ]),
    ...historyFor("24/01401", [
      { kind: "REGISTRATION_SUBMITTED", title: "Registration submitted", detail: "Reference VR-2026-C14D01 was issued." },
      { kind: "CORRECTION_REQUESTED", title: "Academic correction requested", detail: "The student asked the Commission to review academic mapping. The student cannot edit verified fields." },
    ]),
    ...historyFor("24/03401", [
      { kind: "REGISTRATION_SUBMITTED", title: "Registration submitted", detail: "Reference VR-2026-E34F01 was issued." },
      { kind: "ELIGIBILITY_DECISION", title: "Registration rejected", detail: "An authorized mock decision rejected this application. The student cannot reverse that decision here." },
    ]),
    ...historyFor("24/03101", [
      { kind: "ELIGIBILITY_DECISION", title: "Approved as eligible elector", detail: "Mock Election 1 eligibility approved." },
      { kind: "DELEGATE_OUTCOME", title: "Delegate outcome recorded", detail: "Simulated Election 1 outcome: pending inclusion was later confirmed on a mock Electoral College view. Ballot choices are not shown." },
      { kind: "ELECTORAL_COLLEGE_INCLUSION", title: "Electoral College Register", detail: "Simulated inclusion on the approved Electoral College Register." },
      { kind: "ELECTION2_ELIGIBILITY", title: "Election 2 eligibility", detail: "Status set to Eligible Delegate Elector from the register, not from voter or candidate registration alone." },
    ]),
    ...historyFor("24/01201", [
      { kind: "DELEGATE_OUTCOME", title: "Delegate outcome recorded", detail: "Simulated Election 1 outcome: not elected. Election 2 eligibility was not granted." },
      { kind: "ELECTION2_ELIGIBILITY", title: "Election 2 eligibility", detail: "Status set to Not Elected — Not Eligible." },
    ]),
    ...historyFor("24/01313", [
      { kind: "REGISTRATION_STARTED", title: "Registration started", detail: "Draft saved after phone verification. The student can continue later." },
      { kind: "PHONE_VERIFIED", title: "Phone verified", detail: "Simulated OTP completed for the number on the student record." },
    ]),
  ];

  const notifications: VoterNotification[] = [
    {
      id: "vn-01211-1",
      studentId: "24/01211",
      title: "You are an approved eligible elector",
      body: "Your voter registration VR-2026-A12F11 was approved for Election 1. Vote only at your campus polling station.",
      href: "/voter/eligibility",
      read: false,
      createdAt: "2026-09-17T08:00:00.000Z",
    },
    {
      id: "vn-01401-1",
      studentId: "24/01401",
      title: "Your registration needs a correction",
      body: "An authorized reviewer asked for an academic correction. You cannot change the verified record yourself.",
      href: "/voter/registration",
      read: false,
      createdAt: "2026-09-17T09:00:00.000Z",
    },
    {
      id: "vn-01301-1",
      studentId: "24/01301",
      title: "Verification is in progress",
      body: "Your registration was submitted and is pending verification. This does not yet make you an eligible elector.",
      href: "/voter/registration",
      read: true,
      createdAt: "2026-09-16T12:00:00.000Z",
    },
    {
      id: "vn-01313-1",
      studentId: "24/01313",
      title: "Your draft was saved",
      body: "You can continue voter registration from Academic Information Review.",
      href: "/voter/register",
      read: false,
      createdAt: now,
    },
  ];

  const corrections: AcademicCorrectionRequest[] = [
    {
      id: "acr-01401",
      studentId: "24/01401",
      voterProfileId: "vp-24-01401",
      reason: "The school shown is not the school on my admission letter.",
      proposedCampusId: "campus-ruaraka",
      proposedSchoolId: "school-ru-eass",
      proposedDepartmentId: "dept-ru-eass-eps",
      proposedProgrammeId: null,
      status: "PENDING",
      submittedAt: "2026-09-16T14:00:00.000Z",
      decidedAt: null,
      decidedBy: null,
    },
  ];

  return { profiles, history, notifications, corrections };
}
