import { describe, expect, it } from "vitest";
import {
  decryptSensitiveIdentity,
  encryptSensitiveIdentity,
  identitiesMatch,
  identityLast4,
  maskNationalId,
} from "@/lib/identity-crypto";
import { mockNationalId, mockPhone, verifyPresentedIdentity } from "@/lib/student-identity";
import { createInitialStore } from "@/lib/seed";

describe("national ID protection", () => {
  it("encrypts and decrypts a document number", () => {
    const encrypted = encryptSensitiveIdentity("32405106");
    expect(encrypted).not.toContain("32405106");
    expect(decryptSensitiveIdentity(encrypted)).toBe("32405106");
  });

  it("masks ordinary views", () => {
    expect(maskNationalId("5106")).toBe("••••••••5106");
    expect(identityLast4("32-405-106")).toBe("5106");
    expect(identitiesMatch("32405106", "32405106")).toBe(true);
    expect(identitiesMatch("32405107", "32405106")).toBe(false);
  });

  it("verifies seeded student identities against the mock dataset", () => {
    const store = createInitialStore();
    const kevin = store.studentElectors.find((item) => item.studentId === "24/05106");
    expect(kevin?.nationalIdEncrypted).toBeTruthy();
    expect(kevin?.nationalIdLast4).toHaveLength(4);
    expect(verifyPresentedIdentity(kevin!, mockNationalId("24/05106"))).toBe(true);
    expect(verifyPresentedIdentity(kevin!, "00000000")).toBe(false);
    expect(mockPhone("24/05106")).toMatch(/^07/);
  });
});
