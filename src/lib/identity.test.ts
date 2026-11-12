import { describe, expect, it } from "vitest";
import {
  decryptNationalId,
  encryptNationalId,
  hashNationalId,
  maskNationalId,
  maskPhone,
  matchStudentIdentity,
  mockStudentNationalId,
  mockStudentPhone,
  normalizeNationalId,
  publicIdentityView,
} from "@/lib/identity";
import { createInitialStore } from "@/lib/seed";

describe("student identity privacy", () => {
  it("encrypts National ID values and can decrypt them for authorised matching only", () => {
    const encrypted = encryptNationalId("32401212");
    expect(encrypted).not.toContain("32401212");
    expect(decryptNationalId(encrypted)).toBe("32401212");
    expect(hashNationalId("3240 1212")).toBe(hashNationalId("32401212"));
    expect(maskNationalId("1212")).toBe("••••••1212");
  });

  it("masks phone numbers in ordinary views", () => {
    expect(maskPhone(mockStudentPhone("24/01212"))).toMatch(/^07\d{2}••••\d{2}$/);
  });

  it("matches a seeded student only when registration number, National ID and phone agree", () => {
    const store = createInitialStore();
    const studentId = "24/01212";
    const matched = matchStudentIdentity(store, {
      studentId,
      nationalId: mockStudentNationalId(studentId),
      phone: mockStudentPhone(studentId),
    });
    expect(matched?.fullName).toBe("Ian Kiprono Langat");
    expect(
      matchStudentIdentity(store, {
        studentId,
        nationalId: "00000000",
        phone: mockStudentPhone(studentId),
      }),
    ).toBeNull();
    const view = publicIdentityView(store, matched!);
    expect(view.nationalIdMasked).toBe(`••••••${normalizeNationalId(mockStudentNationalId(studentId)).slice(-4)}`);
    expect(view.nationalIdMasked).not.toContain(mockStudentNationalId(studentId));
  });
});
