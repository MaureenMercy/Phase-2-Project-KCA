import "server-only";

import { createHash } from "node:crypto";
import { EncryptJWT, jwtDecrypt } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cookieBaseOptions } from "@/lib/session-crypto";
import { clearElectorSession, readElectorSession } from "@/lib/elector-session";
import { readStore } from "@/lib/store";
import type { AgentRecord, IdentityDocumentType } from "@/lib/types";

export const AGENT_REG_COOKIE = "saku_agent_registration";

export type AgentRegistrationDraft = {
  studentId: string;
  fullName: string;
  phone: string;
  documentType: IdentityDocumentType;
  nationalIdLast4: string;
  phoneVerified: boolean;
  invitationId?: string;
  invitationReference?: string;
  requestedStationId?: string;
  requestedCampusId?: string;
  correctionRequest?: string;
};

function registrationKey() {
  return createHash("sha256").update("saku-prototype-demo-session-secret").digest();
}

export async function saveAgentRegistration(draft: AgentRegistrationDraft) {
  const token = await new EncryptJWT({ ...draft, kind: "agent_registration" })
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuedAt()
    .setExpirationTime("2h")
    .encrypt(registrationKey());
  const jar = await cookies();
  jar.set(AGENT_REG_COOKIE, token, cookieBaseOptions(2 * 60 * 60));
}

export async function readAgentRegistration(): Promise<AgentRegistrationDraft | null> {
  const jar = await cookies();
  const token = jar.get(AGENT_REG_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtDecrypt(token, registrationKey());
    if (payload.kind !== "agent_registration" || !payload.studentId) return null;
    return payload as unknown as AgentRegistrationDraft;
  } catch {
    return null;
  }
}

export async function clearAgentRegistration() {
  const jar = await cookies();
  jar.delete(AGENT_REG_COOKIE);
}

export function agentIdFromSession(electorId: string) {
  return electorId.startsWith("agent:") ? electorId.slice("agent:".length) : null;
}

export async function readAgentFromSession(): Promise<AgentRecord | null> {
  const session = await readElectorSession();
  if (!session) return null;
  const agentId = agentIdFromSession(session.electorId);
  if (!agentId) return null;
  const store = await readStore();
  return store.agents.find((item) => item.id === agentId) ?? null;
}

export async function requireAgentRecord(): Promise<AgentRecord> {
  const agent = await readAgentFromSession();
  if (!agent) redirect("/agent/login");
  return agent;
}

export async function clearAgentPortalSession() {
  await clearElectorSession();
  await clearAgentRegistration();
}
