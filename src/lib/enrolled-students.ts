import type { EnrolledStudentRecord } from "@/lib/ops-client";
import { ELECTION_ID } from "@/lib/seed";
import { normalizeStudentId } from "@/lib/student-auth";
import type { AppStore, StudentElector, StudentElectoralMapping } from "@/lib/types";

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
    courseLabel: row.courseLabel,
    voterStatus: "not_voted",
    createdAt: now,
    updatedAt: now,
  };
}

export function enrolledToMapping(row: EnrolledStudentRecord): StudentElectoralMapping {
  const now = row.enrolledAt || new Date().toISOString();
  return {
    studentId: row.studentId,
    electionId: ELECTION_ID,
    campusId: row.campusId,
    schoolId: row.schoolId,
    departmentId: row.departmentId,
    programId: null,
    eligibilityStatus: "eligible",
    eligibilitySource: "operator_enrollment",
    createdAt: now,
    updatedAt: now,
  };
}

export function mergeEnrolledIntoStore(store: AppStore, rows: EnrolledStudentRecord[]): AppStore {
  if (!rows.length) return store;
  const known = new Set(store.studentElectors.map((student) => normalizeStudentId(student.studentId)));
  const mapped = new Set(store.studentMappings.map((mapping) => normalizeStudentId(mapping.studentId)));
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
  }
  if (added) {
    store.voterRegister = {
      ...store.voterRegister,
      voterCount: store.studentElectors.length,
    };
  }
  return store;
}
