"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { evaluateCommissionAccess } from "@/lib/authorization";
import { isAllowedNow, isHighRisk, ROLE_LABELS } from "@/lib/permissions";
import {
  clearLoginFailures,
  issueOtp,
  loginLockStatus,
  peekDemoOtp,
  registerFailedLogin,
  verifyOtp,
} from "@/lib/otp";
import {
  findCommissionMemberByUserId,
  findDirectoryUser,
  findDirectoryUserById,
} from "@/lib/seed";
import {
  clearSession,
  clearTrustedDevice,
  readSession,
  readTrustedDevice,
  requireAuthorizedSession,
  saveSession,
  saveTrustedDevice,
} from "@/lib/session";
import { isReauthFresh } from "@/lib/session-crypto";
import { appendAudit, readStore, writeStore } from "@/lib/store";
import type { ElectoralPermission, SessionPayload } from "@/lib/types";

export type ActionResult =
  | { ok: true; next?: string; demoOtp?: string | null }
  | { ok: false; error: string; needsReauth?: boolean };

function genericCredentialError() {
  return {
    ok: false as const,
    error: "Work ID or password is incorrect.",
  };
}

const LoginSchema = z.object({
  workId: z.string().trim().min(1, "Enter your Work ID."),
  password: z.string().min(1, "Enter your institutional password."),
  trustDevice: z.boolean(),
});

export async function loginWithWorkId(input: {
  workId: string;
  password: string;
  trustDevice: boolean;
}): Promise<ActionResult> {
  const parsed = LoginSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Check your details." };
  }
  const workId = parsed.data.workId.toUpperCase();
  const { password, trustDevice } = parsed.data;


  const lock = loginLockStatus(workId);
  if (lock.locked) {
    return {
      ok: false,
      error: "This Work ID is temporarily locked after repeated failed attempts. Try again in a few minutes.",
    };
  }

  const user = findDirectoryUser(workId);
  const passwordOk = user
    ? await bcrypt.compare(password, user.passwordHash)
    : await bcrypt.compare(
        password,
        "$2b$10$7Ty1982sTG6WMko6.C9kHuJztfZpyfErzjvdxqoHiZYBL4O7B4u8.",
      );

  if (!user || !passwordOk || user.workId !== workId) {
    const failure = registerFailedLogin(workId);
    if (failure.locked) {
      return {
        ok: false,
        error: "This Work ID is temporarily locked after repeated failed attempts. Try again in a few minutes.",
      };
    }
    return genericCredentialError();
  }

  clearLoginFailures(workId);

  const trusted = await readTrustedDevice();
  const trustedMatch = trusted?.userId === user.id && trusted?.workId === user.workId;

  if (trustDevice) {
    await saveTrustedDevice(user.id, user.workId);
  }

  const base = {
    userId: user.id,
    workId: user.workId,
    fullName: user.fullName,
    shortName: user.shortName,
    lastActivityAt: Date.now(),
  };

  if (trustedMatch) {
    await saveSession({ ...base, state: "pending_authorization" });
    return { ok: true, next: "/commission/authorize" };
  }

  issueOtp(user.id);
  await saveSession({ ...base, state: "pending_mfa" });
  return { ok: true, next: "/commission/mfa" };
}

export async function getDemoOtp() {
  const session = await readSession();
  if (!session || session.state !== "pending_mfa") return null;
  return peekDemoOtp(session.userId);
}

export async function verifyMfa(otp: string): Promise<ActionResult> {
  const session = await readSession();
  if (!session || session.state !== "pending_mfa") {
    return { ok: false, error: "Your sign-in session expired. Start again." };
  }

  if (!/^\d{6}$/.test(otp.trim())) {
    return { ok: false, error: "Enter the 6-digit one-time password." };
  }

  if (!verifyOtp(session.userId, otp)) {
    return { ok: false, error: "That one-time password is invalid or has expired." };
  }

  await saveSession({
    ...session,
    state: "pending_authorization",
    lastActivityAt: Date.now(),
  });

  return { ok: true, next: "/commission/authorize" };
}

export async function completeAuthorization() {
  const session = await readSession();
  if (!session) {
    return {
      granted: false as const,
      steps: [],
      reason: "Session expired. Sign in again.",
      failedStep: "credentials",
    };
  }

  if (session.state === "authorized") {
    return {
      granted: true as const,
      alreadyAuthorized: true,
      steps: [],
      role: session.role,
    };
  }

  if (session.state === "denied") {
    return {
      granted: false as const,
      steps: [
        {
          key: "credentials",
          label: "Credential verification",
          status: "pass" as const,
          detail: "Work ID and institutional password were verified.",
        },
        {
          key: "mfa",
          label: "Multi-factor authentication",
          status: "pass" as const,
          detail: "One-time verification for this session was completed.",
        },
        {
          key: "identify",
          label: "Identify commission member",
          status: "fail" as const,
          detail: session.reason ?? "This account is not an Electoral Commission member.",
        },
      ],
      reason: session.reason ?? "Access denied.",
      failedStep: session.failedStep ?? "identify",
    };
  }

  const user = findDirectoryUserById(session.userId);
  const member = findCommissionMemberByUserId(session.userId);
  const store = await readStore();

  const decision = evaluateCommissionAccess({
    credentialsValid: true,
    mfaVerified: session.state === "pending_authorization",
    directoryUser: user,
    commissionMember: member,
    election: store.election,
  });

  if (!decision.granted || !user || !member) {
    const denied: SessionPayload = {
      ...session,
      state: "denied",
      reason: decision.granted ? "Access denied." : decision.reason,
      failedStep: decision.granted ? "identify" : decision.failedStep,
      lastActivityAt: Date.now(),
    };
    await saveSession(denied);
    await appendAudit({
      actorWorkId: session.workId,
      actorName: session.fullName,
      action: "authorization_denied",
      detail: denied.reason ?? "Authorization denied.",
      highRisk: false,
    });
    return decision.granted
      ? {
          granted: false as const,
          steps: decision.steps,
          reason: "Access denied.",
          failedStep: "identify",
        }
      : decision;
  }

  return decision;
}

export async function commitCommissionAccess() {
  const session = await readSession();
  if (!session) {
    return { ok: false as const, error: "Session expired. Sign in again." };
  }
  if (session.state === "authorized") return { ok: true as const };

  const user = findDirectoryUserById(session.userId);
  const member = findCommissionMemberByUserId(session.userId);
  const store = await readStore();
  const decision = evaluateCommissionAccess({
    credentialsValid: true,
    mfaVerified: session.state === "pending_authorization",
    directoryUser: user,
    commissionMember: member,
    election: store.election,
  });

  if (!decision.granted || !user || !member) {
    return { ok: false as const, error: decision.granted ? "Access denied." : decision.reason };
  }

  await saveSession({
    ...session,
    state: "authorized",
    memberId: member.id,
    role: member.role,
    electionId: member.electionId,
    pollingStationIds: member.pollingStationIds,
    lastActivityAt: Date.now(),
  });

  await appendAudit({
    actorWorkId: user.workId,
    actorName: user.fullName,
    action: "commission_access_granted",
    detail: `Granted ${ROLE_LABELS[member.role]} access to ${store.election.name}.`,
    highRisk: false,
  });

  return { ok: true as const };
}

export async function logoutAction() {
  await clearSession();
  revalidatePath("/", "layout");
}

export async function logoutAndForgetDevice() {
  await clearSession();
  await clearTrustedDevice();
  revalidatePath("/", "layout");
}

export async function reauthenticate(password: string): Promise<ActionResult> {
  const session = await requireAuthorizedSession();
  const user = findDirectoryUserById(session.userId);
  if (!user) return { ok: false, error: "Account could not be verified." };
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return { ok: false, error: "Password is incorrect." };
  await saveSession({ ...session, reauthenticatedAt: Date.now() });
  await appendAudit({
    actorWorkId: session.workId,
    actorName: session.fullName,
    action: "reauthentication",
    detail: "Re-authenticated for a high-risk electoral action.",
    highRisk: true,
  });
  return { ok: true };
}

async function assertPermission(permission: ElectoralPermission) {
  const session = await requireAuthorizedSession();
  const store = await readStore();
  if (!session.role || !isAllowedNow(session.role, permission, store.election.stage)) {
    return {
      session,
      store,
      error: "Your Electoral Commission authority does not permit this action at the current election stage.",
    };
  }
  if (isHighRisk(permission) && !isReauthFresh(session)) {
    return { session, store, needsReauth: true as const };
  }
  return { session, store };
}

export async function decideCandidate(
  candidateId: string,
  decision: "approved" | "rejected",
): Promise<ActionResult> {
  const gate = await assertPermission("approve_candidates");
  if ("error" in gate && gate.error) return { ok: false, error: gate.error };
  if ("needsReauth" in gate && gate.needsReauth) {
    return { ok: false, error: "Re-authentication is required.", needsReauth: true };
  }

  await writeStore((store) => {
    store.candidates = store.candidates.map((candidate) =>
      candidate.id === candidateId
        ? {
            ...candidate,
            status: decision,
            reviewedBy: gate.session.fullName,
            reviewedAt: new Date().toISOString(),
          }
        : candidate,
    );
    return store;
  });

  await appendAudit({
    actorWorkId: gate.session.workId,
    actorName: gate.session.fullName,
    action: "approve_candidates",
    detail: `${decision === "approved" ? "Approved" : "Rejected"} candidate ${candidateId}.`,
    highRisk: false,
  });
  revalidatePath("/commission/candidates");
  revalidatePath("/commission/dashboard");
  return { ok: true };
}

export async function approveVoterRegister(): Promise<ActionResult> {
  const gate = await assertPermission("approve_voter_register");
  if ("error" in gate && gate.error) return { ok: false, error: gate.error };
  if ("needsReauth" in gate && gate.needsReauth) {
    return { ok: false, error: "Re-authentication is required.", needsReauth: true };
  }

  await writeStore((store) => {
    store.voterRegister = {
      ...store.voterRegister,
      status: "approved",
      approvedAt: new Date().toISOString(),
      approvedBy: gate.session.fullName,
    };
    return store;
  });

  await appendAudit({
    actorWorkId: gate.session.workId,
    actorName: gate.session.fullName,
    action: "approve_voter_register",
    detail: `Approved voter register ${gate.store.voterRegister.version}.`,
    highRisk: false,
  });
  revalidatePath("/commission/voter-register");
  return { ok: true };
}

export async function authorizeElectionOpening(): Promise<ActionResult> {
  const gate = await assertPermission("authorize_election_opening");
  if ("error" in gate && gate.error) return { ok: false, error: gate.error };
  if ("needsReauth" in gate && gate.needsReauth) {
    return { ok: false, error: "Re-authentication is required.", needsReauth: true };
  }

  const { validateElection1Readiness } = await import("@/lib/electoral");
  const seatIssues = validateElection1Readiness(gate.store).filter((issue) => issue.code === "seats");
  if (gate.store.election.contest === "ELECTION_1_DELEGATE" && seatIssues.length) {
    return {
      ok: false,
      error: "Election 1 cannot open while any electoral unit has an unconfigured delegate-seat allocation.",
    };
  }

  await writeStore((store) => {
    store.election.stage = "VOTING";
    store.election.openedAt = new Date().toISOString();
    return store;
  });

  await appendAudit({
    actorWorkId: gate.session.workId,
    actorName: gate.session.fullName,
    action: "authorize_election_opening",
    detail: "Authorized opening of voting.",
    highRisk: true,
  });
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function authorizeElectionClosing(): Promise<ActionResult> {
  const gate = await assertPermission("authorize_election_closing");
  if ("error" in gate && gate.error) return { ok: false, error: gate.error };
  if ("needsReauth" in gate && gate.needsReauth) {
    return { ok: false, error: "Re-authentication is required.", needsReauth: true };
  }

  await writeStore((store) => {
    store.election.stage = "CLOSED";
    store.election.closedAt = new Date().toISOString();
    return store;
  });

  await appendAudit({
    actorWorkId: gate.session.workId,
    actorName: gate.session.fullName,
    action: "authorize_election_closing",
    detail: "Authorized closing of voting. Results pending authorization.",
    highRisk: true,
  });
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function authorizeResults(): Promise<ActionResult> {
  const gate = await assertPermission("authorize_results");
  if ("error" in gate && gate.error) return { ok: false, error: gate.error };
  if ("needsReauth" in gate && gate.needsReauth) {
    return { ok: false, error: "Re-authentication is required.", needsReauth: true };
  }

  await writeStore((store) => {
    store.election.stage = "CERTIFIED";
    store.election.resultsAuthorizedAt = new Date().toISOString();
    store.election.resultsAuthorizedBy = gate.session.fullName;
    return store;
  });

  await appendAudit({
    actorWorkId: gate.session.workId,
    actorName: gate.session.fullName,
    action: "authorize_results",
    detail: "Authorized official SAKU election results.",
    highRisk: true,
  });
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function markNotificationsRead() {
  const session = await requireAuthorizedSession();
  await writeStore((store) => {
    store.notifications = store.notifications.map((item) =>
      item.audience === "all" ||
      (session.role && Array.isArray(item.audience) && item.audience.includes(session.role))
        ? { ...item, read: true }
        : item,
    );
    return store;
  });
  revalidatePath("/commission/dashboard");
  return { ok: true as const };
}
