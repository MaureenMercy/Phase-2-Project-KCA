import type { EnrolledStudentRecord } from "@/lib/ops-client";
import { last4, mockNationalId, mockPhone } from "@/lib/identity";
import { encryptNationalId, hashNationalId } from "@/lib/identity-crypto";
import { ELECTION_1_ID, electoralUnitId } from "@/lib/seed-electorate";
import { normalizeStudentId } from "@/lib/student-auth";
import type { AppStore, StudentElector, StudentElectoralMapping, StudentIdentity } from "@/lib/types";

export function enrolledToStudent(row: EnrolledStudentRecord): StudentElector {
  const now = row.enrolledAt || new Date().toISOString();
  return {
    id: `st-enroll-${row.studentId.replaceAll("/", "-")}`,
    studentId: row.studentId,
    fullName: row.fullName,
    yearOfStudy: 1,
    campusId: row.campusId,
    schoolId: row.schoolId,
    departmentId: row.departmentId,
    programId: null,
    eligibilityStatus: "eligible",
    eligibilitySource: "operator_enrollment",
    gender: "UNSPECIFIED",
    election1Eligibility: "eligible",
    election1VotingStatus: "not_voted",
    electedDelegateStatus: "not_applicable",
    electoralCollegeEligibility: "not_applicable",
    election2Eligibility: "not_applicable",
    election2VotingStatus: "not_applicable",
    verificationStatus: "verified",
    courseLabel: row.courseLabel,
    voterStatus: "not_voted",
    accessibility: {
      declared: false,
      categories: [],
      accommodations: [],
      notes: "",
      updatedAt: null,
      consentToShareOperationally: false,
    },
    createdAt: now,
    updatedAt: now,
  };
}

export function enrolledToMapping(row: EnrolledStudentRecord): StudentElectoralMapping {
  const now = row.enrolledAt || new Date().toISOString();
  return {
    studentId: row.studentId,
    electionId: ELECTION_1_ID,
    electoralUnitId: electoralUnitId({
      campusId: row.campusId,
      schoolId: row.schoolId,
      departmentId: row.departmentId,
      unitKind:
        row.campusId === "campus-ruaraka"
          ? "DEPARTMENT"
          : row.campusId === "campus-western"
            ? "SCHOOL"
            : "CAMPUS_WIDE",
    }),
    campusId: row.campusId,
    schoolId: row.campusId === "campus-town" || row.campusId === "campus-kitengela" ? null : row.schoolId,
    departmentId: row.campusId === "campus-ruaraka" ? row.departmentId : null,
    programId: null,
    eligibilityStatus: "eligible",
    eligibilitySource: "operator_enrollment",
    createdAt: now,
    updatedAt: now,
  };
}

function enrolledToIdentity(row: EnrolledStudentRecord): StudentIdentity {
  const now = row.enrolledAt || new Date().toISOString();
  const nationalId = mockNationalId(row.studentId);
  return {
    id: `sid-enroll-${row.studentId.replaceAll("/", "-")}`,
    studentId: row.studentId,
    fullName: row.fullName,
    phoneNumber: mockPhone(row.studentId),
    campusId: row.campusId,
    schoolId: row.schoolId,
    departmentId: row.departmentId,
    programId: null,
    programmeLabel: row.courseLabel,
    nationalIdHash: hashNationalId(nationalId),
    nationalIdEncrypted: encryptNationalId(nationalId),
    nationalIdLast4: last4(nationalId),
    recordSource: "operator_enrollment",
    createdAt: now,
    updatedAt: now,
  };
}

export function mergeEnrolledIntoStore(store: AppStore, rows: EnrolledStudentRecord[]): AppStore {
  if (!rows.length) return store;
  const known = new Set(store.studentElectors.map((student) => normalizeStudentId(student.studentId)));
  const mapped = new Set(store.studentMappings.map((mapping) => normalizeStudentId(mapping.studentId)));
  const identities = new Set(
    store.studentIdentities.map((identity) => normalizeStudentId(identity.studentId)),
  );
  let added = 0;
  for (const row of rows) {
    const key = normalizeStudentId(row.studentId);
    if (!known.has(key)) {
      store.studentElectors.push(enrolledToStudent(row));
      known.add(key);
      added += 1;
    }
    if (!mapped.has(key)) {
      store.studentMappings.push(enrolledToMapping(row));
      mapped.add(key);
    }
    if (!identities.has(key)) {
      store.studentIdentities.push(enrolledToIdentity(row));
      identities.add(key);
    }
  }
  if (added) {
    store.voterRegister = {
      ...store.voterRegister,
      voterCount: store.studentElectors.length,
    };
  }
  return store;
}
