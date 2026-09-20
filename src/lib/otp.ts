import { createHash, randomInt, timingSafeEqual } from "node:crypto";

const otpStore = new Map<
  string,
  { hash: string; demoOtp: string; expiresAt: number }
>();

const attemptStore = new Map<
  string,
  { count: number; lockedUntil?: number }
>();

function hashValue(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function issueOtp(userId: string) {
  const demoOtp = String(randomInt(100000, 1000000)).padStart(6, "0");
  otpStore.set(userId, {
    hash: hashValue(demoOtp),
    demoOtp,
    expiresAt: Date.now() + 5 * 60 * 1000,
  });
  return demoOtp;
}

export function peekDemoOtp(userId: string) {
  const pending = otpStore.get(userId);
  if (!pending || pending.expiresAt < Date.now()) return null;
  return pending.demoOtp;
}

export function verifyOtp(userId: string, otp: string) {
  const pending = otpStore.get(userId);
  if (!pending) return false;
  if (pending.expiresAt < Date.now()) {
    otpStore.delete(userId);
    return false;
  }
  const presented = hashValue(otp.trim());
  const expected = Buffer.from(pending.hash, "hex");
  const actual = Buffer.from(presented, "hex");
  if (expected.length !== actual.length) return false;
  const ok = timingSafeEqual(expected, actual);
  if (ok) otpStore.delete(userId);
  return ok;
}

export function clearOtp(userId: string) {
  otpStore.delete(userId);
}

export function registerFailedLogin(workId: string) {
  const key = workId.trim().toUpperCase();
  const current = attemptStore.get(key) ?? { count: 0 };
  if (current.lockedUntil && current.lockedUntil > Date.now()) {
    return { locked: true, retryAt: current.lockedUntil };
  }
  const count = current.count + 1;
  if (count >= 5) {
    const lockedUntil = Date.now() + 5 * 60 * 1000;
    attemptStore.set(key, { count, lockedUntil });
    return { locked: true, retryAt: lockedUntil };
  }
  attemptStore.set(key, { count });
  return { locked: false as const, remaining: 5 - count };
}

export function loginLockStatus(workId: string) {
  const key = workId.trim().toUpperCase();
  const current = attemptStore.get(key);
  if (current?.lockedUntil && current.lockedUntil > Date.now()) {
    return { locked: true as const, retryAt: current.lockedUntil };
  }
  return { locked: false as const };
}

export function clearLoginFailures(workId: string) {
  attemptStore.delete(workId.trim().toUpperCase());
}
