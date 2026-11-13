import bcrypt from "bcryptjs";

export const SEEDED_STUDENT_PIN = "SAKU2026";

export function normalizeStudentId(value: string) {
  return value.trim().toUpperCase().replace(/[\u2215\u2044\uFF0F]/g, "/");
}

export async function pinMatchesStudent(input: {
  pin: string;
  enrolledPasswordHash?: string | null;
}) {
  if (input.enrolledPasswordHash) {
    return bcrypt.compare(input.pin, input.enrolledPasswordHash);
  }
  return input.pin === SEEDED_STUDENT_PIN;
}
