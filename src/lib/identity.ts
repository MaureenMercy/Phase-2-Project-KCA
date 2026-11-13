import type { IdentityDocumentPolicy } from "@/lib/types";

export const DEFAULT_IDENTITY_DOCUMENT_POLICY: IdentityDocumentPolicy = {
  allowedTypes: [
    { id: "NATIONAL_ID", label: "Kenyan National ID", enabled: true },
  ],
  pendingPolicyNote:
    "An alternative-document policy has not yet been finalized by the Commission. Only document types enabled in this configuration may be used. Do not assume any other identity document is approved.",
};

export type { IdentityDocumentPolicy };

export function mockNationalId(studentId: string) {
  const digits = studentId.replace(/\D/g, "").padStart(7, "0").slice(-7);
  return `3${digits}`;
}

export function mockPhone(studentId: string) {
  const digits = studentId.replace(/\D/g, "").padStart(7, "0").slice(-7);
  return `071${digits}`;
}

export function last4(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.slice(-4).padStart(4, "•");
}

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

export function normalizeNationalId(value: string) {
  return value.replace(/\s+/g, "").trim();
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
