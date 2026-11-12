import {
  decryptSensitiveIdentity,
  encryptSensitiveIdentity,
  identitiesMatch,
  identityLast4,
} from "@/lib/identity-crypto";
import { normalizeStudentId } from "@/lib/student-auth";
import type {
  Campus,
  ElectoralDepartment,
  IdentityDocumentType,
  School,
  StudentElector,
} from "@/lib/types";

export const IDENTITY_DOCUMENT_LABELS: Record<IdentityDocumentType, string> = {
  NATIONAL_ID: "Kenyan National ID",
  PASSPORT: "Passport",
  REFUGEE_ID: "Refugee ID",
};

export function mockNationalId(studentId: string): string {
  const digits = studentId.replace(/\D/g, "").padStart(8, "0").slice(-8);
  const value = 30000000 + (Number(digits) % 60000000);
  return String(value).padStart(8, "0");
}

export function mockPhone(studentId: string): string {
  const digits = studentId.replace(/\D/g, "").padStart(8, "0").slice(-8);
  return `07${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 8)}`;
}

export function programmeLabelForSchool(schoolName: string | undefined) {
  const school = schoolName ?? "";
  if (school.includes("Technology")) return "Bachelor of Science in Information Technology";
  if (school.includes("Education")) return "Bachelor of Education";
  if (school.includes("Professional")) return "Diploma in Business Management";
  return "Bachelor of Commerce";
}

export function courseLabelFor(
  student: Pick<StudentElector, "campusId" | "schoolId" | "departmentId" | "courseLabel">,
  catalogues: {
    campuses: Campus[];
    schools: School[];
    departments: ElectoralDepartment[];
  },
) {
  if (student.courseLabel) return student.courseLabel;
  const campus = catalogues.campuses.find((item) => item.id === student.campusId)?.name ?? "Campus";
  const school = catalogues.schools.find((item) => item.id === student.schoolId)?.name ?? "School";
  const department = catalogues.departments.find((item) => item.id === student.departmentId)?.name;
  if (department) return `${campus} · ${school} · ${department.replace(/^Department of /, "")}`;
  return `${campus} · ${school}`;
}

export function attachMockIdentity(student: StudentElector): StudentElector {
  const nationalId = mockNationalId(student.studentId);
  const encrypted =
    student.nationalIdEncrypted || student.nationalIdCipher || encryptSensitiveIdentity(nationalId);
  const phone = student.phone || student.phoneNumber || mockPhone(student.studentId);
  return {
    ...student,
    phone,
    phoneNumber: student.phoneNumber || phone,
    identityDocumentType: student.identityDocumentType ?? "NATIONAL_ID",
    nationalIdEncrypted: encrypted,
    nationalIdCipher: student.nationalIdCipher || encrypted,
    nationalIdLast4: student.nationalIdLast4 || identityLast4(nationalId),
  };
}

export function publicStudentIdentity(
  student: StudentElector,
  catalogues: {
    campuses: Campus[];
    schools: School[];
    departments: ElectoralDepartment[];
  },
) {
  const last4 = student.nationalIdLast4 || identityLast4(mockNationalId(student.studentId));
  const campus = catalogues.campuses.find((item) => item.id === student.campusId);
  const school = catalogues.schools.find((item) => item.id === student.schoolId);
  const department = catalogues.departments.find((item) => item.id === student.departmentId);
  return {
    studentId: student.studentId,
    fullName: student.fullName,
    phone: student.phone || mockPhone(student.studentId),
    documentType: student.identityDocumentType ?? "NATIONAL_ID",
    documentTypeLabel: IDENTITY_DOCUMENT_LABELS[student.identityDocumentType ?? "NATIONAL_ID"],
    nationalIdMasked: `••••••••${last4}`,
    nationalIdLast4: last4,
    campusId: student.campusId,
    campusName: campus?.name ?? "Unknown campus",
    schoolId: student.schoolId,
    schoolName: school?.name ?? "Unknown school",
    departmentId: student.departmentId,
    departmentName: department?.name ?? "Not mapped to a department",
    programme: programmeLabelForSchool(school?.name),
    courseLabel: courseLabelFor(student, catalogues),
  };
}

export function findStudentIdentity(students: StudentElector[], studentId: string) {
  const key = normalizeStudentId(studentId);
  return students.find((item) => normalizeStudentId(item.studentId) === key) ?? null;
}

export function verifyPresentedIdentity(student: StudentElector, presented: string) {
  const stored = student.nationalIdEncrypted
    ? decryptSensitiveIdentity(student.nationalIdEncrypted)
    : null;
  const canonical = stored || mockNationalId(student.studentId);
  return identitiesMatch(presented, canonical);
}
