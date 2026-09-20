import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  cookieBaseOptions,
  decryptPayload,
  decryptTrustedDevice,
  encryptPayload,
  encryptTrustedDevice,
  isIdleExpired,
  SESSION_ABSOLUTE_SECONDS,
  SESSION_COOKIE,
  TRUSTED_DEVICE_COOKIE,
  TRUSTED_DEVICE_SECONDS,
} from "@/lib/session-crypto";
import type { SessionPayload } from "@/lib/types";

export async function readSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await decryptPayload(token);
  if (!session) return null;
  if (isIdleExpired(session)) {
    jar.delete(SESSION_COOKIE);
    return null;
  }
  return session;
}

export async function saveSession(session: SessionPayload) {
  const token = await encryptPayload({
    ...session,
    lastActivityAt: Date.now(),
  });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, cookieBaseOptions(SESSION_ABSOLUTE_SECONDS));
}

export async function touchSession(session: SessionPayload) {
  await saveSession({ ...session, lastActivityAt: Date.now() });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export async function readTrustedDevice() {
  const jar = await cookies();
  const token = jar.get(TRUSTED_DEVICE_COOKIE)?.value;
  if (!token) return null;
  return decryptTrustedDevice(token);
}

export async function saveTrustedDevice(userId: string, workId: string) {
  const token = await encryptTrustedDevice({ userId, workId });
  const jar = await cookies();
  jar.set(
    TRUSTED_DEVICE_COOKIE,
    token,
    cookieBaseOptions(TRUSTED_DEVICE_SECONDS),
  );
}

export async function clearTrustedDevice() {
  const jar = await cookies();
  jar.delete(TRUSTED_DEVICE_COOKIE);
}

export async function requirePendingMfa() {
  const session = await readSession();
  if (!session) redirect("/commission/login");
  if (session.state === "authorized") redirect("/commission/dashboard");
  if (session.state === "pending_authorization") redirect("/commission/authorize");
  if (session.state === "denied") redirect("/commission/denied");
  if (session.state !== "pending_mfa") redirect("/commission/login");
  return session;
}

export async function requirePendingAuthorization() {
  const session = await readSession();
  if (!session) redirect("/commission/login");
  if (session.state === "authorized") redirect("/commission/dashboard");
  if (session.state === "pending_mfa") redirect("/commission/mfa");
  if (session.state === "denied") redirect("/commission/denied");
  if (session.state !== "pending_authorization") redirect("/commission/login");
  return session;
}

export async function requireAuthorizedSession() {
  const session = await readSession();
  if (!session) redirect("/commission/login");
  if (session.state === "pending_mfa") redirect("/commission/mfa");
  if (session.state === "pending_authorization") redirect("/commission/authorize");
  if (session.state === "denied") redirect("/commission/denied");
  if (session.state !== "authorized" || !session.role || !session.memberId) {
    redirect("/commission/login");
  }
  await touchSession(session);
  return session;
}
