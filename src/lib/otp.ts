import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import { opsClearAttempt, opsDeleteOtp, opsGetAttempt, opsGetOtp, opsSaveAttempt, opsSaveOtp } from "@/lib/ops-client";

/** Stable demonstration OTP on serverless hosts where in-memory maps do not survive. */
export const DEMO_HOST_OTP = "202026";

export function isDemoHost() {
  return process.env.VERCEL === "1" || process.env.SAKU_DEMO === "1";
}

type OtpRecord = { hash: string; demoOtp: string; expiresAt: number };
type AttemptRecord = { count: number; lockedUntil?: number };

// Server actions and page renders are separate bundles in dev. A module-level
// Map is empty on the MFA page even after login just issued a code.
const otpMemory = globalThis as typeof globalThis & {
  __sakuOtpStore?: Map<string, OtpRecord>;
  __sakuLoginAttempts?: Map<string, AttemptRecord>;
};

function otpStore() {
  otpMemory.__sakuOtpStore ??= new Map();
  return otpMemory.__sakuOtpStore;
}

function attemptStore() {
  otpMemory.__sakuLoginAttempts ??= new Map();
  return otpMemory.__sakuLoginAttempts;
}

function hashValue(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export async function issueOtp(userId: string, options?: { ttlMs?: number }) {
  const demoOtp = isDemoHost()
    ? DEMO_HOST_OTP
    : String(randomInt(100000, 1000000)).padStart(6, "0");
  const ttlMs = options?.ttlMs ?? 5 * 60 * 1000;
  const record = {
    hash: hashValue(demoOtp),
    demoOtp,
    expiresAt: Date.now() + ttlMs,
  };
  otpStore().set(userId, record);
  await opsSaveOtp(userId, record);
  return demoOtp;
}

export async function peekDemoOtp(userId: string) {
  if (isDemoHost()) return DEMO_HOST_OTP;
  const remote = await opsGetOtp(userId);
  if (remote && remote.expiresAt >= Date.now()) {
    otpStore().set(userId, remote);
    return remote.demoOtp;
  }
  const pending = otpStore().get(userId);
  if (!pending || pending.expiresAt < Date.now()) return null;
  return pending.demoOtp;
}

export async function verifyOtp(userId: string, otp: string) {
  if (isDemoHost() && otp.trim() === DEMO_HOST_OTP) return true;
  const remote = await opsGetOtp(userId);
  if (remote) otpStore().set(userId, remote);
  const pending = otpStore().get(userId);
  if (!pending) return false;
  if (pending.expiresAt < Date.now()) {
    otpStore().delete(userId);
    await opsDeleteOtp(userId);
    return false;
  }
  const presented = hashValue(otp.trim());
  const expected = Buffer.from(pending.hash, "hex");
  const actual = Buffer.from(presented, "hex");
  if (expected.length !== actual.length) return false;
  const ok = timingSafeEqual(expected, actual);
  if (ok) {
    otpStore().delete(userId);
    await opsDeleteOtp(userId);
  }
  return ok;
}

export async function clearOtp(userId: string) {
  otpStore().delete(userId);
  await opsDeleteOtp(userId);
}

async function currentAttempt(key: string) {
  const remote = await opsGetAttempt(key);
  if (remote) attemptStore().set(key, remote);
  return attemptStore().get(key);
}

export async function registerFailedLogin(workId: string) {
  const key = workId.trim().toUpperCase();
  const current = (await currentAttempt(key)) ?? { count: 0 };
  if (current.lockedUntil && current.lockedUntil > Date.now()) {
    return { locked: true, retryAt: current.lockedUntil };
  }
  const count = current.count + 1;
  if (count >= 5) {
    const lockedUntil = Date.now() + 5 * 60 * 1000;
    const record = { count, lockedUntil };
    attemptStore().set(key, record);
    await opsSaveAttempt(key, record);
    return { locked: true, retryAt: lockedUntil };
  }
  const record = { count };
  attemptStore().set(key, record);
  await opsSaveAttempt(key, record);
  return { locked: false as const, remaining: 5 - count };
}

export async function loginLockStatus(workId: string) {
  const key = workId.trim().toUpperCase();
  const current = await currentAttempt(key);
  if (current?.lockedUntil && current.lockedUntil > Date.now()) {
    return { locked: true as const, retryAt: current.lockedUntil };
  }
  return { locked: false as const };
}

export async function clearLoginFailures(workId: string) {
  const key = workId.trim().toUpperCase();
  attemptStore().delete(key);
  await opsClearAttempt(key);
}
