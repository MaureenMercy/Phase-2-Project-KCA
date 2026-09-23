import { createHash } from "node:crypto";
import { EncryptJWT, jwtDecrypt, errors as joseErrors } from "jose";
import type { ElectorSessionPayload, SessionPayload } from "@/lib/types";

export const SESSION_COOKIE = "saku_ec_session";
export const TRUSTED_DEVICE_COOKIE = "saku_ec_trusted";
export const ELECTOR_COOKIE = "saku_elector_session";
export const SESSION_IDLE_MS = 30 * 60 * 1000;
export const SESSION_ABSOLUTE_SECONDS = 12 * 60 * 60;
export const TRUSTED_DEVICE_SECONDS = 30 * 24 * 60 * 60;
export const REAUTH_WINDOW_MS = 5 * 60 * 1000;

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (secret && secret.length >= 16) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET must be set to a long random value.");
  }
  return "saku-dev-only-session-secret";
}

function getKey() {
  return createHash("sha256").update(getSecret()).digest();
}

export async function encryptPayload(payload: SessionPayload) {
  return new EncryptJWT({ ...payload })
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_ABSOLUTE_SECONDS}s`)
    .encrypt(getKey());
}

export async function decryptPayload(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtDecrypt(token, getKey());
    if (!payload.state || !payload.userId || !payload.workId) return null;
    return payload as unknown as SessionPayload;
  } catch (error) {
    if (error instanceof joseErrors.JOSEError) return null;
    return null;
  }
}

export type TrustedDevice = {
  userId: string;
  workId: string;
};

export async function encryptTrustedDevice(device: TrustedDevice) {
  return new EncryptJWT({ ...device, kind: "trusted_device" })
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuedAt()
    .setExpirationTime(`${TRUSTED_DEVICE_SECONDS}s`)
    .encrypt(getKey());
}

export async function decryptTrustedDevice(token: string): Promise<TrustedDevice | null> {
  try {
    const { payload } = await jwtDecrypt(token, getKey());
    if (payload.kind !== "trusted_device" || !payload.userId || !payload.workId) {
      return null;
    }
    return {
      userId: String(payload.userId),
      workId: String(payload.workId),
    };
  } catch {
    return null;
  }
}

export function isIdleExpired(session: SessionPayload, now = Date.now()) {
  return now - session.lastActivityAt > SESSION_IDLE_MS;
}

export function isReauthFresh(session: SessionPayload, now = Date.now()) {
  return Boolean(
    session.reauthenticatedAt && now - session.reauthenticatedAt < REAUTH_WINDOW_MS,
  );
}

export function cookieBaseOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

export async function encryptElectorPayload(payload: ElectorSessionPayload) {
  return new EncryptJWT({ ...payload, kind: payload.kind })
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuedAt()
    .setExpirationTime("2h")
    .encrypt(getKey());
}

export async function decryptElectorPayload(
  token: string,
): Promise<ElectorSessionPayload | null> {
  try {
    const { payload } = await jwtDecrypt(token, getKey());
    if (!payload.electorId || !payload.registrationNumber || !payload.kind) {
      return null;
    }
    return payload as unknown as ElectorSessionPayload;
  } catch {
    return null;
  }
}
