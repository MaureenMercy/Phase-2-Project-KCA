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

export function opsPhotoUrl(candidateId: string) {
  return `/api/ops/photos/${encodeURIComponent(candidateId)}`;
}
