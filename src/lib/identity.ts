import type { AppStore, IdentityDocumentPolicy, StudentIdentity } from "@/lib/types";

function identityKey(studentId: string) {
  return studentId.trim().toUpperCase().replace(/[\u2215\u2044\uFF0F]/g, "/");
}

export const DEFAULT_IDENTITY_DOCUMENT_POLICY: IdentityDocumentPolicy = {
  allowedTypes: [
    { id: "NATIONAL_ID", label: "Kenyan National ID", enabled: true },
  ],
  pendingPolicyNote:
    "An alternative-document policy has not yet been finalized by the Commission. Only document types enabled in this configuration may be used. Do not assume any other identity document is approved.",
};

export type { IdentityDocumentPolicy };

export function normalizeNationalId(value: string) {
  return value.replace(/[\s-]/g, "").toUpperCase();
}

export function normalizePhone(value: string) {
  const trimmed = value.trim();
  if (trimmed.startsWith("+254")) {
    return `0${trimmed.slice(4).replace(/\D/g, "")}`;
  }
  return trimmed.replace(/[\s-]/g, "");
}

export function mockNationalId(studentId: string) {
  const digits = studentId.replace(/\D/g, "").padStart(7, "0").slice(-7);
  return `3${digits}`;
}

export function mockPhone(studentId: string) {
  const digits = studentId.replace(/\D/g, "").padStart(7, "0").slice(-7);
  return `071${digits}`;
}

export const mockStudentNationalId = mockNationalId;
export const mockStudentPhone = mockPhone;

export function last4(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.slice(-4).padStart(4, "•");
}

export const last4NationalId = last4;

export function maskNationalId(lastFour: string | null | undefined) {
  if (!lastFour) return "••••••••";
  return `••••${lastFour.slice(-4)}`;
}

export function maskPhone(phone: string | null | undefined) {
  if (!phone) return "Not recorded";
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return "••••";
  return `${digits.slice(0, 2)}••••${digits.slice(-4)}`;
}

export function nationalIdMatches(input: {
  presented: string;
  cipher?: string | null;
  studentId: string;
}) {
  const presented = normalizeNationalId(input.presented);
  if (!presented) return false;
  return presented === mockNationalId(input.studentId);
}

export function enabledDocumentTypes(policy: IdentityDocumentPolicy = DEFAULT_IDENTITY_DOCUMENT_POLICY) {
  return policy.allowedTypes.filter((item) => item.enabled);
}

export function isDocumentTypeAllowed(
  typeId: string,
  policy: IdentityDocumentPolicy = DEFAULT_IDENTITY_DOCUMENT_POLICY,
) {
  return enabledDocumentTypes(policy).some((item) => item.id === typeId);
}

export function identityByStudentId(store: AppStore, studentId: string) {
  const key = identityKey(studentId);
  return (
    store.studentIdentities.find((item) => identityKey(item.studentId) === key) ?? null
  );
}

export function matchStudentIdentity(
  store: AppStore,
  input: { studentId: string; nationalId: string; phone: string },
): StudentIdentity | null {
  const identity = identityByStudentId(store, input.studentId);
  if (!identity) return null;
  if (!nationalIdMatches({ presented: input.nationalId, studentId: identity.studentId })) return null;
  if (normalizePhone(identity.phoneNumber) !== normalizePhone(input.phone)) return null;
  return identity;
}

export function programmeLabelFor(input: {
  departmentName?: string | null;
  schoolName?: string | null;
}) {
  if (input.departmentName) {
    return input.departmentName.replace(/^Department of /i, "");
  }
  return input.schoolName ?? "Programme not on record";
}

export function academicLabels(
  store: Pick<AppStore, "campuses" | "schools" | "departments">,
  identity: Pick<StudentIdentity, "campusId" | "schoolId" | "departmentId" | "programmeLabel">,
) {
  const campus = store.campuses.find((item) => item.id === identity.campusId);
  const school = store.schools.find((item) => item.id === identity.schoolId);
  const department = identity.departmentId
    ? store.departments.find((item) => item.id === identity.departmentId)
    : null;
  return {
    campusName: campusDisplayName(campus?.id ?? "", campus?.name ?? "Unknown campus"),
    schoolName: school?.name ?? "Unknown school",
    departmentName: department
      ? department.name.replace(/^Department of /i, "")
      : identity.programmeLabel,
    programmeLabel: identity.programmeLabel,
  };
}

export function campusDisplayName(campusId: string, campusName: string) {
  if (campusId === "campus-western") return "Western / Kisumu";
  return campusName;
}

export type PublicStudentIdentity = {
  studentId: string;
  fullName: string;
  nationalIdMasked: string;
  phoneMasked: string;
  campusId: string;
  schoolId: string;
  departmentId: string | null;
  programId: string | null;
  campusName: string;
  schoolName: string;
  departmentName: string;
  programmeLabel: string;
};

export function publicIdentityView(
  store: AppStore,
  identity: StudentIdentity,
): PublicStudentIdentity {
  const academic = academicLabels(store, identity);
  return {
    studentId: identity.studentId,
    fullName: identity.fullName,
    nationalIdMasked: maskNationalId(identity.nationalIdLast4),
    phoneMasked: maskPhone(identity.phoneNumber),
    campusId: identity.campusId,
    schoolId: identity.schoolId,
    departmentId: identity.departmentId,
    programId: identity.programId,
    ...academic,
  };
}
