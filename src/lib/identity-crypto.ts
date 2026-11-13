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

export function hashNationalId(value: string) {
  return createHash("sha256").update(value.replace(/[\s-]/g, "").toUpperCase()).digest("hex");
}

export function encryptNationalId(plain: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", identityKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plain.trim(), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${toHex(iv)}.${toHex(tag)}.${toHex(encrypted)}`;
}

export function decryptNationalId(cipherText: string | null | undefined) {
  if (!cipherText) return null;
  const [ivPart, tagPart, dataPart] = cipherText.split(".");
  if (!ivPart || !tagPart || !dataPart) return null;
  try {
    const decipher = createDecipheriv("aes-256-gcm", identityKey(), fromHex(ivPart));
    decipher.setAuthTag(fromHex(tagPart));
    const plain = Buffer.concat([decipher.update(fromHex(dataPart)), decipher.final()]);
    return plain.toString("utf8");
  } catch {
    return null;
  }
}
