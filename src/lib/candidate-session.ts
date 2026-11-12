import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  CANDIDATE_COOKIE,
  cookieBaseOptions,
  decryptCandidatePayload,
  encryptCandidatePayload,
} from "@/lib/session-crypto";
import type { CandidateSessionPayload } from "@/lib/types";

const CANDIDATE_SESSION_SECONDS = 8 * 60 * 60;

export async function readCandidateSession() {
  const jar = await cookies();
  const token = jar.get(CANDIDATE_COOKIE)?.value;
  if (!token) return null;
  return decryptCandidatePayload(token);
}

export async function saveCandidateSession(session: CandidateSessionPayload) {
  const token = await encryptCandidatePayload({
    ...session,
    lastActivityAt: Date.now(),
  });
  const jar = await cookies();
  jar.set(CANDIDATE_COOKIE, token, cookieBaseOptions(CANDIDATE_SESSION_SECONDS));
}

export async function clearCandidateSession() {
  const jar = await cookies();
  jar.delete(CANDIDATE_COOKIE);
}

export async function requireCandidateSession() {
  const session = await readCandidateSession();
  if (!session || session.state !== "authenticated") {
    redirect("/candidate/verify");
  }
  return session;
}

export async function requirePendingCandidateOtp() {
  const session = await readCandidateSession();
  if (!session) redirect("/candidate/verify");
  if (session.state === "authenticated") redirect("/candidate/dashboard");
  if (session.state !== "pending_otp") redirect("/candidate/verify");
  return session;
}
