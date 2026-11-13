import { normalizeStudentId } from "@/lib/student-auth";
import type {
  AgentInvitation,
  AgentRecord,
  AppStore,
  CandidateApplication,
} from "@/lib/types";

export const DEFAULT_MAX_AGENTS_PER_CANDIDATE = 2;

export const AGENT_FORBIDDEN_ACTIONS = [
  "modify_voter_records",
  "modify_candidate_records",
  "modify_candidate_eligibility",
  "configure_elections",
  "configure_ballots",
  "access_voter_choices",
  "view_vote_totals",
  "declare_results",
  "accredit_agents",
  "classify_incidents",
  "escalate_incidents",
  "resolve_incidents",
  "close_incidents",
  "view_commission_deliberations",
  "view_other_agent_reports",
] as const;

export type AgentForbiddenAction = (typeof AGENT_FORBIDDEN_ACTIONS)[number];

export type AgentCapability =
  | "viewDashboard"
  | "viewAssociation"
  | "viewAccreditation"
  | "viewStation"
  | "viewInstructions"
  | "viewReports"
  | "viewNotifications"
  | "viewProfile"
  | "requestCorrection"
  | "checkIn"
  | "observe"
  | "reportIncident"
  | "verifyBallot";

const PENDING_CAPABILITIES: AgentCapability[] = [
  "viewDashboard",
  "viewAssociation",
  "viewAccreditation",
  "viewStation",
  "viewInstructions",
  "viewReports",
  "viewNotifications",
  "viewProfile",
  "requestCorrection",
];

const ACCREDITED_CAPABILITIES: AgentCapability[] = [
  ...PENDING_CAPABILITIES,
  "checkIn",
  "observe",
  "reportIncident",
  "verifyBallot",
];

export function accreditationLabel(status: AgentRecord["accreditationStatus"]) {
  switch (status) {
    case "ACCREDITED":
      return "Approved";
    case "PENDING":
      return "Pending";
    case "DECLINED":
      return "Declined";
    case "SUSPENDED":
      return "Suspended";
    case "REVOKED":
      return "Revoked";
    default:
      return status;
  }
}

export function applicationLabel(status: AgentRecord["applicationStatus"]) {
  switch (status) {
    case "DRAFT":
      return "Draft";
    case "SUBMITTED":
      return "Submitted";
    case "UNDER_REVIEW":
      return "Under review";
    case "APPROVED":
      return "Approved";
    case "REJECTED":
      return "Rejected";
    default:
      return status;
  }
}

export function reportStatusLabel(status: string | null | undefined) {
  switch (status) {
    case "reviewed":
      return "Under Review";
    case "escalated":
      return "Further Information Requested";
    case "closed":
      return "Resolved / Closed";
    case "open":
    default:
      return "Submitted";
  }
}

export function agentStudentId(agent: AgentRecord) {
  return normalizeStudentId(agent.studentId || agent.registrationNumber);
}

export function isAccredited(agent: AgentRecord) {
  return agent.accreditationStatus === "ACCREDITED";
}

export function agentCan(agent: AgentRecord | null | undefined, capability: AgentCapability) {
  if (!agent) return false;
  if (agent.applicationStatus === "DRAFT" && capability !== "viewProfile" && capability !== "requestCorrection") {
    return PENDING_CAPABILITIES.includes(capability);
  }
  if (agent.accreditationStatus === "ACCREDITED") {
    return ACCREDITED_CAPABILITIES.includes(capability);
  }
  return PENDING_CAPABILITIES.includes(capability);
}

export function lockedReason(agent: AgentRecord | null | undefined, capability: AgentCapability) {
  if (agentCan(agent, capability)) return null;
  if (!agent) return "Sign in to the Agent Portal to continue.";
  if (agent.accreditationStatus === "SUSPENDED") {
    return "Your accreditation is suspended. Observation and reporting access has been withdrawn.";
  }
  if (agent.accreditationStatus === "REVOKED") {
    return "Your accreditation was revoked. Observation and reporting access has been withdrawn.";
  }
  if (agent.accreditationStatus === "DECLINED") {
    return "This nomination was not accredited. You cannot perform accredited observation activities.";
  }
  return "Accredited observation activities are available only after the Electoral Commission approves your accreditation.";
}

export function maxAgentsPerCandidate(store: Pick<AppStore, "agentPolicy">) {
  return store.agentPolicy?.maxAgentsPerCandidate || DEFAULT_MAX_AGENTS_PER_CANDIDATE;
}

export function candidateAgentUsage(
  store: Pick<AppStore, "agents" | "agentInvitations">,
  candidateApplicationId: string,
) {
  const activeAgents = store.agents.filter(
    (item) =>
      item.candidateApplicationId === candidateApplicationId &&
      item.applicationStatus !== "REJECTED" &&
      item.accreditationStatus !== "DECLINED" &&
      item.accreditationStatus !== "REVOKED",
  );
  const taken = new Set(activeAgents.map(agentStudentId));
  const openInvites = store.agentInvitations.filter(
    (item) =>
      item.candidateApplicationId === candidateApplicationId &&
      item.status === "OPEN" &&
      !taken.has(normalizeStudentId(item.invitedStudentId)),
  ).length;
  return openInvites + activeAgents.length;
}

export function candidateHasCapacity(
  store: Pick<AppStore, "agents" | "agentInvitations" | "agentPolicy">,
  candidateApplicationId: string,
) {
  return candidateAgentUsage(store, candidateApplicationId) < maxAgentsPerCandidate(store);
}

export type InvitationEvaluation =
  | { ok: true; invitation: AgentInvitation }
  | { ok: false; code: "invalid" | "expired" | "revoked" | "used" | "unavailable" | "mismatch" | "unapproved"; message: string };

export function evaluateInvitation(input: {
  invitation: AgentInvitation | null | undefined;
  studentId: string;
  now?: Date;
  candidate?: CandidateApplication | null;
  store?: Pick<AppStore, "agents" | "agentInvitations" | "agentPolicy">;
}): InvitationEvaluation {
  const invitation = input.invitation;
  if (!invitation) {
    return {
      ok: false,
      code: "invalid",
      message:
        "This invitation reference is not recognised. Ask the candidate who nominated you for the correct reference.",
    };
  }

  const studentId = normalizeStudentId(input.studentId);
  if (normalizeStudentId(invitation.invitedStudentId) !== studentId) {
    return {
      ok: false,
      code: "mismatch",
      message:
        "This invitation was issued for a different student. Sign in with the nominated registration number, or ask the candidate to issue an invitation in your name.",
    };
  }

  if (invitation.status === "REVOKED") {
    return {
      ok: false,
      code: "revoked",
      message:
        "This invitation was withdrawn. You cannot use it to apply. Ask the candidate whether a new nomination can be issued.",
    };
  }

  if (invitation.status === "USED") {
    return {
      ok: false,
      code: "used",
      message: "This invitation has already been used. Each nomination can be completed only once.",
    };
  }

  if (invitation.status === "UNAVAILABLE") {
    return {
      ok: false,
      code: "unavailable",
      message:
        "This candidate cannot accept another agent right now. The Commission limit for agents on this ticket has been reached.",
    };
  }

  const now = input.now ?? new Date();
  if (invitation.status === "EXPIRED" || new Date(invitation.expiresAt).getTime() <= now.getTime()) {
    return {
      ok: false,
      code: "expired",
      message: `This invitation expired on ${new Date(invitation.expiresAt).toLocaleString("en-KE")}. Ask the candidate to issue a new nomination.`,
    };
  }

  if (input.candidate && (input.candidate.vettingStatus !== "APPROVED" || input.candidate.electionKind !== "COUNCIL")) {
    return {
      ok: false,
      code: "unapproved",
      message:
        "The candidate who invited you is not currently an approved SAKU Council candidate, so this nomination cannot proceed.",
    };
  }

  return { ok: true, invitation };
}

export function findInvitation(store: Pick<AppStore, "agentInvitations">, reference: string) {
  const key = reference.trim().toUpperCase();
  return store.agentInvitations.find((item) => item.reference.toUpperCase() === key) ?? null;
}

export function ownReports<T extends { agentId: string }>(rows: T[], agentId: string) {
  return rows.filter((item) => item.agentId === agentId);
}

export function agentMayAccessStation(agent: AgentRecord, stationId: string) {
  if (!isAccredited(agent)) return false;
  return agent.permittedStationIds.includes(stationId) || agent.assignedStationId === stationId;
}

export function denyForbiddenAgentAction(action: AgentForbiddenAction) {
  return {
    ok: false as const,
    error:
      action === "view_other_agent_reports"
        ? "You may only view reports that you submitted."
        : "Agents cannot perform Electoral Commission functions. This action is reserved for authorised Commission officials.",
  };
}
