export const ELECTION_STAGES = [
  "REGISTRATION",
  "VOTING",
  "CLOSED",
  "CERTIFIED",
] as const;

export type ElectionStage = (typeof ELECTION_STAGES)[number];

export const COMMISSION_ROLES = [
  "CHAIR",
  "VICE_CHAIR",
  "SECRETARY_GENERAL",
  "COMMISSIONER",
] as const;

export type CommissionRole = (typeof COMMISSION_ROLES)[number];

export const ELECTORAL_PERMISSIONS = [
  "view_dashboard",
  "approve_candidates",
  "approve_voter_register",
  "assign_polling_stations",
  "manage_commission_records",
  "station_operations",
  "authorize_election_opening",
  "authorize_election_closing",
  "view_results",
  "authorize_results",
  "view_audit_trail",
] as const;

export type ElectoralPermission = (typeof ELECTORAL_PERMISSIONS)[number];

export const TECHNICAL_PERMISSIONS = [
  "modify_server_configuration",
  "alter_databases",
  "deploy_software",
  "manage_backups_recovery",
  "view_raw_security_logs",
  "manage_technical_incidents",
] as const;

export type TechnicalPermission = (typeof TECHNICAL_PERMISSIONS)[number];

export type PipelineStepStatus = "pass" | "fail" | "info";

export type PipelineStep = {
  key: string;
  label: string;
  status: PipelineStepStatus;
  detail: string;
};

export type AuthorizationDecision =
  | {
      granted: true;
      steps: PipelineStep[];
      role: CommissionRole;
      electionId: string;
      pollingStationIds: string[];
      permissions: ElectoralPermission[];
    }
  | {
      granted: false;
      steps: PipelineStep[];
      reason: string;
      failedStep: string;
    };

export type InstitutionalUser = {
  id: string;
  workId: string;
  fullName: string;
  shortName: string;
  title: string;
  email: string;
  passwordHash: string;
  accountKind: "commission" | "technical" | "staff";
};

export type CommissionMember = {
  id: string;
  userId: string;
  role: CommissionRole;
  electionId: string;
  pollingStationIds: string[];
  active: boolean;
};

export type PollingStation = {
  id: string;
  name: string;
  campus: string;
  code: string;
};

export type CandidateRecord = {
  id: string;
  fullName: string;
  ticket: string;
  position: string;
  campus: string;
  status: "pending" | "approved" | "rejected";
  reviewedBy?: string | null;
  reviewedAt?: string | null;
};

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  href: string;
  audience: "all" | CommissionRole[];
};

export type AuditEvent = {
  id: string;
  at: string;
  actorWorkId: string;
  actorName: string;
  action: string;
  detail: string;
  highRisk: boolean;
};

export type VoterRegister = {
  version: string;
  status: "draft" | "submitted" | "approved" | "locked";
  voterCount: number;
  submittedAt: string | null;
  approvedAt: string | null;
  approvedBy: string | null;
};

export type ElectionRecord = {
  id: string;
  name: string;
  shortName: string;
  year: number;
  stage: ElectionStage;
  openedAt: string | null;
  closedAt: string | null;
  resultsAuthorizedAt: string | null;
  resultsAuthorizedBy: string | null;
};

export type AppStore = {
  election: ElectionRecord;
  pollingStations: PollingStation[];
  candidates: CandidateRecord[];
  voterRegister: VoterRegister;
  notifications: NotificationItem[];
  auditLog: AuditEvent[];
};

export type SessionState =
  | "pending_mfa"
  | "pending_authorization"
  | "authorized"
  | "denied";

export type SessionPayload = {
  state: SessionState;
  userId: string;
  workId: string;
  fullName: string;
  shortName: string;
  memberId?: string;
  role?: CommissionRole;
  electionId?: string;
  pollingStationIds?: string[];
  reason?: string;
  failedStep?: string;
  reauthenticatedAt?: number;
  lastActivityAt: number;
};
