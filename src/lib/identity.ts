import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { normalizeStudentId } from "@/lib/student-auth";
import type { AppStore, StudentIdentity } from "@/lib/types";

const NATIONAL_ID_KEY_MATERIAL = "saku-prototype-national-id-key";

function nationalIdKey() {
  return createHash("sha256").update(NATIONAL_ID_KEY_MATERIAL).digest();
}

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

export function hashNationalId(value: string) {
  return createHash("sha256").update(normalizeNationalId(value)).digest("hex");
}

export function encryptNationalId(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", nationalIdKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(normalizeNationalId(value), "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [iv, tag, encrypted].map((part) => part.toString("base64url")).join(".");
}

export function decryptNationalId(payload: string) {
  const [ivPart, tagPart, dataPart] = payload.split(".");
  if (!ivPart || !tagPart || !dataPart) return null;
  try {
    const decipher = createDecipheriv(
      "aes-256-gcm",
      nationalIdKey(),
      Buffer.from(ivPart, "base64url"),
    );
    decipher.setAuthTag(Buffer.from(tagPart, "base64url"));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(dataPart, "base64url")),
      decipher.final(),
    ]);
    return decrypted.toString("utf8");
  } catch {
    return null;
  }
}

export function maskNationalId(last4: string) {
  return `••••••${last4}`;
}

export function maskPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 6) return "••••••••••";
  return `${digits.slice(0, 4)}••••${digits.slice(-2)}`;
}

export function mockStudentNationalId(studentId: string) {
  const digits = studentId.replace(/\D/g, "");
  return `3${digits}`.slice(0, 8).padEnd(8, "0");
}

export function mockStudentPhone(studentId: string) {
  const digits = studentId.replace(/\D/g, "").padStart(8, "0").slice(-8);
  return `07${digits}`;
}

export function last4NationalId(value: string) {
  return normalizeNationalId(value).slice(-4);
}

export function identityByStudentId(store: AppStore, studentId: string) {
  const key = normalizeStudentId(studentId);
  return (
    store.studentIdentities.find((item) => normalizeStudentId(item.studentId) === key) ?? null
  );
}

export function matchStudentIdentity(
  store: AppStore,
  input: { studentId: string; nationalId: string; phone: string },
): StudentIdentity | null {
  const identity = identityByStudentId(store, input.studentId);
  if (!identity) return null;
  if (identity.nationalIdHash !== hashNationalId(input.nationalId)) return null;
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
