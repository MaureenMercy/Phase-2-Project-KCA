import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

function identityKey() {
  return createHash("sha256").update("saku-prototype-national-id-key").digest();
}

function toHex(value: Buffer) {
  return value.toString("hex");
}

function fromHex(value: string) {
  return Buffer.from(value, "hex");
}

export function encryptNationalId(plain: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", identityKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plain.trim(), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${toHex(iv)}.${toHex(tag)}.${toHex(encrypted)}`;
}

function decryptDottedHex(cipherText: string) {
  const [ivPart, tagPart, dataPart] = cipherText.split(".");
  if (!ivPart || !tagPart || !dataPart) return null;
  const decipher = createDecipheriv("aes-256-gcm", identityKey(), fromHex(ivPart));
  decipher.setAuthTag(fromHex(tagPart));
  const plain = Buffer.concat([decipher.update(fromHex(dataPart)), decipher.final()]);
  return plain.toString("utf8");
}

function decryptBase64Url(cipherText: string) {
  const buf = Buffer.from(cipherText, "base64url");
  if (buf.length < 29) return null;
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const data = buf.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", identityKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}

export function decryptNationalId(cipherText: string | null | undefined) {
  if (!cipherText) return null;
  try {
    return cipherText.includes(".") ? decryptDottedHex(cipherText) : decryptBase64Url(cipherText);
  } catch {
    return null;
  }
}

export function encryptSensitiveIdentity(plain: string): string {
  return encryptNationalId(plain);
}

export function decryptSensitiveIdentity(payload: string): string | null {
  return decryptNationalId(payload);
}

export function identityLast4(value: string): string {
  const digits = value.replace(/\D/g, "");
  return digits.slice(-4).padStart(4, "0");
}

export function maskNationalId(lastFour: string): string {
  const tail = identityLast4(lastFour);
  return `••••••••${tail}`;
}

export function identitiesMatch(presented: string, canonical: string): boolean {
  const a = presented.replace(/\s+/g, "").toUpperCase();
  const b = canonical.replace(/\s+/g, "").toUpperCase();
  return a.length >= 6 && a === b;
}
