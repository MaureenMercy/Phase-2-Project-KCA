const API_URL = process.env.SAKU_API_URL ?? "http://127.0.0.1:4000";
const API_KEY = process.env.SAKU_OPS_SECRET ?? "saku-ops-demo-key";

export type OpsPolicy = {
  mode: "open" | "allowlist";
  allowedIps: string[];
  applyToCommission: boolean;
  updatedAt?: string;
  updatedBy?: string;
};

export type OpsEvent = {
  at: string;
  ip?: string;
  userAgent?: string;
  workstationId?: string;
  action: string;
  actor?: string;
  path?: string;
  allowed: boolean;
  reason?: string;
};

export type OpsVote = {
  electionId: string;
  kind: "election1" | "cabinet";
  studentId: string;
  fullName: string;
  unitId?: string;
  campusId?: string;
  candidateIds?: string[];
  candidateNames?: string[];
  ip?: string;
  userAgent?: string;
  workstationId?: string;
  castAt: string;
};

export type OpsAnalytics = {
  policy: OpsPolicy;
  totals: {
    election1Ballots: number;
    cabinetBallots: number;
    accessEvents: number;
    deniedAttempts: number;
  };
  byCampus: { label: string; value: number }[];
  byCandidate: { label: string; value: number }[];
  byCabinetCandidate: { label: string; value: number }[];
  byIp: { label: string; value: number }[];
  recentEvents: OpsEvent[];
  voters: Array<{
    studentId: string;
    fullName: string;
    unitId?: string;
    ip?: string;
    workstationId?: string;
    castAt: string;
  }>;
  cabinetVoters: Array<{
    studentId: string;
    fullName: string;
    ip?: string;
    workstationId?: string;
    castAt: string;
  }>;
};

async function opsFetch<T>(path: string, init?: RequestInit): Promise<T | null> {
  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...init,
      cache: "no-store",
      headers: {
        "content-type": "application/json",
        "x-saku-ops-key": API_KEY,
        ...(init?.headers ?? {}),
      },
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export async function opsHealth() {
  return opsFetch<{ ok: boolean }>("/health");
}

export async function opsGetPolicy() {
  return opsFetch<OpsPolicy>("/policy");
}

export async function opsSavePolicy(input: {
  mode: "open" | "allowlist";
  allowedIps: string[];
  applyToCommission: boolean;
  updatedBy: string;
}) {
  return opsFetch<OpsPolicy>("/policy", {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function opsCheckAccess(ip: string) {
  return opsFetch<{ allowed: boolean; reason: string; mode: string; applyToCommission: boolean }>(
    "/access/check",
    { method: "POST", body: JSON.stringify({ ip }) },
  );
}

export async function opsLogEvent(event: Omit<OpsEvent, "at"> & { at?: string }) {
  return opsFetch<OpsEvent>("/access/events", {
    method: "POST",
    body: JSON.stringify(event),
  });
}

export async function opsRecordVote(vote: Omit<OpsVote, "castAt">) {
  return opsFetch<OpsVote>("/votes", {
    method: "POST",
    body: JSON.stringify(vote),
  });
}

export async function opsListVotes(kind?: "election1" | "cabinet") {
  const suffix = kind ? `?kind=${kind}` : "";
  return (await opsFetch<OpsVote[]>(`/votes${suffix}`)) ?? [];
}

export async function opsAnalytics() {
  return opsFetch<OpsAnalytics>("/analytics");
}

export async function opsSavePhoto(input: {
  candidateId: string;
  kind: "delegate" | "leadership" | "cabinet";
  mimeType: string;
  data: string;
  uploadedBy: string;
}) {
  return opsFetch(`/photos/${encodeURIComponent(input.candidateId)}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function opsListPhotos() {
  return (
    (await opsFetch<Array<{ candidateId: string }>>("/photos")) ?? []
  );
}

export async function opsSyncDirectory(input: { accounts: unknown[]; members: unknown[] }) {
  return opsFetch<{ accounts: number; members: number }>("/directory/sync", {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function opsFindAccount(query: { workId?: string; id?: string }) {
  const params = new URLSearchParams();
  if (query.workId) params.set("workId", query.workId);
  if (query.id) params.set("id", query.id);
  return opsFetch<{
    id: string;
    workId: string;
    fullName: string;
    shortName: string;
    title: string;
    email: string;
    passwordHash: string;
    accountKind: "commission" | "technical" | "staff";
  }>(`/directory/accounts?${params.toString()}`);
}

export async function opsFindMember(userId: string) {
  return opsFetch<{
    id: string;
    userId: string;
    role: "CHAIR" | "VICE_CHAIR" | "SECRETARY_GENERAL" | "COMMISSIONER";
    electionId: string;
    pollingStationIds: string[];
    active: boolean;
  }>(`/directory/members?userId=${encodeURIComponent(userId)}`);
}

export async function opsSaveOtp(userId: string, record: { hash: string; demoOtp: string; expiresAt: number }) {
  return opsFetch(`/auth/otp/${encodeURIComponent(userId)}`, {
    method: "PUT",
    body: JSON.stringify(record),
  });
}

export async function opsGetOtp(userId: string) {
  return opsFetch<{ hash: string; demoOtp: string; expiresAt: number }>(
    `/auth/otp/${encodeURIComponent(userId)}`,
  );
}

export async function opsDeleteOtp(userId: string) {
  return opsFetch(`/auth/otp/${encodeURIComponent(userId)}`, { method: "DELETE" });
}

export async function opsGetAttempt(workId: string) {
  return opsFetch<{ count: number; lockedUntil?: number }>(
    `/auth/attempts/${encodeURIComponent(workId)}`,
  );
}

export async function opsSaveAttempt(workId: string, record: { count: number; lockedUntil?: number }) {
  return opsFetch(`/auth/attempts/${encodeURIComponent(workId)}`, {
    method: "PUT",
    body: JSON.stringify(record),
  });
}

export async function opsClearAttempt(workId: string) {
  return opsFetch(`/auth/attempts/${encodeURIComponent(workId)}`, { method: "DELETE" });
}

export async function opsLoadRegistry() {
  return opsFetch<{ updatedAt: number; payload: unknown }>("/registry");
}

export async function opsSaveRegistry(payload: unknown, updatedAt: number) {
  return opsFetch<{ ok: boolean; updatedAt: number }>("/registry", {
    method: "PUT",
    body: JSON.stringify({ payload, updatedAt }),
  });
}

export type RecordsSummary = {
  database: string;
  storage: string;
  registryUpdatedAt: number | null;
  counts: {
    commissionAccounts: number;
    memberships: number;
    studentElectors: number;
    collegeElectors: number;
    delegateVotes: number;
    cabinetVotes: number;
    storedBallots: number;
    accessEvents: number;
    portraits: number;
    otpChallenges: number;
    auditEntries: number;
  };
  voterRegister: { version?: string; status?: string; voterCount?: number } | null;
  accounts: Array<{
    workId: string;
    fullName: string;
    title: string;
    accountKind: string;
    role: string | null;
  }>;
  electors: Array<{
    studentId: string;
    fullName: string;
    voterStatus: string;
    eligibilityStatus: string;
  }>;
  college: Array<{
    registrationNumber: string;
    fullName: string;
    electorStatus: string;
  }>;
  recentAccess: Array<{
    at: string;
    action: string;
    actor: string;
    path: string;
    allowed: boolean;
  }>;
};

export async function opsRecordsSummary() {
  return opsFetch<RecordsSummary>("/records/summary");
}

export function opsPhotoUrl(candidateId: string) {
  return `/api/ops/photos/${encodeURIComponent(candidateId)}`;
}
