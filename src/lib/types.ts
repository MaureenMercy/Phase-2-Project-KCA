export const STORE_VERSION = 3;

export const ELECTION_STAGES = [
  "REGISTRATION",
  "VOTING",
  "CLOSED",
  "CERTIFIED",
] as const;

export type ElectionStage = (typeof ELECTION_STAGES)[number];

export const ELECTION_CONTESTS = [
  "ELECTION_1_DELEGATE",
  "SAKU_LEADERSHIP",
] as const;

export type ElectionContest = (typeof ELECTION_CONTESTS)[number];

export const COMMISSION_ROLES = [
  "CHAIR",
  "VICE_CHAIR",
  "SECRETARY_GENERAL",
  "COMMISSIONER",
] as const;

export type CommissionRole = (typeof COMMISSION_ROLES)[number];

export const ELECTORAL_PERMISSIONS = [
  "view_dashboard",
  "configure_election",
  "configure_delegate_seats",
  "approve_candidates",
  "approve_voter_register",
  "assign_polling_stations",
  "manage_commission_records",
  "station_operations",
  "record_incidents",
  "view_incidents",
  "authorize_election_opening",
  "authorize_election_closing",
  "view_results",
  "authorize_results",
  "manage_media",
  "view_legal",
  "view_reports",
  "view_accessibility",
  "view_audit_trail",
  "initiate_emergency",
  "authorize_emergency",
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

export const STATION_STATES = [
  "NOT_READY",
  "READY",
  "OPEN",
  "CLOSED",
] as const;

export type StationState = (typeof STATION_STATES)[number];

export const CABINET_CONTEST_IDS = [
  "special-interests",
  "sports",
  "academic",
  "treasurer",
  "secretary-general",
  "president-ticket",
] as const;

export type CabinetContestId = (typeof CABINET_CONTEST_IDS)[number];

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

export type StationReadiness = {
  votingPcs: boolean;
  votingArea: boolean;
  materials: boolean;
  prepared: boolean;
};

export type PollingStation = {
  id: string;
  name: string;
  campus: string;
  campusId: string;
  code: string;
  status: StationState;
  votesCast: number;
  networkAuthorized: boolean;
  serverReady: boolean;
  readiness: StationReadiness;
  openedAt: string | null;
  openedBy: string | null;
  closedAt: string | null;
  closedBy: string | null;
};

export type CandidateRecord = {
  id: string;
  fullName: string;
  ticket: string;
  position: string;
  campus: string;
  status: "pending" | "approved" | "rejected";
  photo?: string;
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
  audience: "all" | CommissionRole[] | "technical" | "finance" | "media";
};

export type AuditEvent = {
  id: string;
  at: string;
  actorWorkId: string;
  actorName: string;
  action: string;
  detail: string;
  highRisk: boolean;
  entity?: string;
  entityId?: string;
  oldValue?: string | null;
  newValue?: string | null;
  reason?: string;
  stationId?: string;
  electionStage?: string;
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
  contest: ElectionContest;
  electionDate: string;
  startTime: string;
  endTime: string;
  votingMethod: "ELECTRONIC";
  emergencyStatus: "RUNNING" | "PAUSED";
  openedAt: string | null;
  closedAt: string | null;
  resultsAuthorizedAt: string | null;
  resultsAuthorizedBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Campus = {
  id: string;
  name: string;
  code: string;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
};

export type School = {
  id: string;
  campusId: string;
  name: string;
  code: string;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
};

export type ElectoralDepartment = {
  id: string;
  schoolId: string;
  name: string;
  code: string;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
};

export type Programme = {
  id: string;
  schoolId: string;
  departmentId: string | null;
  name: string;
  code: string;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
};

export type ElectoralUnitConfiguration = {
  id: string;
  electionId: string;
  campusId: string;
  schoolId: string;
  departmentId: string | null;
  programId: string | null;
  delegateSeats: number | null;
  seatStatus: "UNCONFIGURED" | "DRAFT" | "SUBMITTED" | "APPROVED";
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
};

export type StudentElector = {
  id: string;
  studentId: string;
  fullName: string;
  yearOfStudy: number;
  campusId: string;
  schoolId: string;
  departmentId: string | null;
  programId: string | null;
  eligibilityStatus: "eligible" | "ineligible" | "pending";
  eligibilitySource: "mock_first_year_register";
  voterStatus: "not_voted" | "voted";
  createdAt: string;
  updatedAt: string;
};

export type StudentElectoralMapping = {
  studentId: string;
  electionId: string;
  campusId: string;
  schoolId: string;
  departmentId: string | null;
  programId: string | null;
  eligibilityStatus: "eligible" | "ineligible" | "pending";
  eligibilitySource: string;
  createdAt: string;
  updatedAt: string;
};

export type DelegateCandidate = {
  id: string;
  studentId: string;
  electionId: string;
  fullName: string;
  photo: string;
  campusId: string;
  schoolId: string;
  departmentId: string | null;
  candidateType: "DELEGATE";
  approvalStatus: "pending" | "approved" | "rejected";
  votesReceived: number;
  status: "active" | "withdrawn";
  createdAt: string;
  updatedAt: string;
};

export type DelegateVote = {
  id: string;
  electionId: string;
  studentId: string;
  unitId: string;
  candidateIds: string[];
  castAt: string;
};

export type ElectedDelegate = {
  id: string;
  electionId: string;
  studentId: string;
  candidateId: string;
  unitId: string;
  fullName: string;
  votesReceived: number;
  confirmed: boolean;
};

export type ElectoralCollegeEntry = {
  id: string;
  electionId: string;
  studentId: string;
  registrationNumber: string;
  fullName: string;
  campusId: string;
  schoolId: string;
  departmentId: string | null;
  electorStatus: "pending_verification" | "active" | "voted" | "ineligible";
  otpHash?: string | null;
  otpDemo?: string | null;
  otpExpiresAt?: number | null;
  votedAt?: string | null;
};

export type ElectoralCollegeRegister = {
  electionId: string;
  status: "not_generated" | "draft" | "verified" | "active";
  generatedAt: string | null;
  verifiedAt: string | null;
  verifiedBy: string | null;
  entries: ElectoralCollegeEntry[];
};

export type CabinetCandidate = {
  id: string;
  contestId: CabinetContestId;
  fullName: string;
  photo: string;
  runningMateId?: string;
  runningMateName?: string;
  runningMatePhoto?: string;
  ticketLabel?: string;
  status: "approved";
};

export type CabinetBallotDraft = {
  electorId: string;
  selections: Partial<Record<CabinetContestId, string>>;
  step: number;
  startedAt: string;
  updatedAt: string;
};

export type CabinetVote = {
  id: string;
  electionId: string;
  electorId: string;
  selections: Record<CabinetContestId, string>;
  submittedAt: string;
};

export type AssignmentRecord = {
  id: string;
  memberId: string;
  stationId: string;
  assignedBy: string;
  assignedAt: string;
  active: boolean;
  endedAt: string | null;
  endedBy: string | null;
};

export type IncidentEvidence = {
  id: string;
  filename: string;
  mimeType: string;
  storedName: string;
  reference: string;
  uploadedAt: string;
  uploadedBy: string;
};

export type IncidentRecord = {
  id: string;
  electionId: string;
  stationId: string;
  reportedByWorkId: string;
  reportedByName: string;
  reporterRole: CommissionRole;
  category: "process" | "technical" | "security" | "conduct" | "other";
  description: string;
  occurredAt: string;
  recordedAt: string;
  status: "open" | "reviewed" | "escalated" | "closed";
  evidence: IncidentEvidence[];
  escalationNote?: string | null;
  reference: string;
};

export type EmergencyAction = {
  id: string;
  electionId: string;
  kind: "PAUSE" | "RESUME";
  initiatedByWorkId: string;
  initiatedByName: string;
  initiatedAt: string;
  authorizedByWorkId: string | null;
  authorizedByName: string | null;
  authorizedAt: string | null;
  reason: string;
  evidenceNote: string;
  statusBefore: "RUNNING" | "PAUSED";
  statusAfter: "RUNNING" | "PAUSED" | null;
  status: "pending_authorization" | "authorized" | "rejected";
  durationMinutes?: number | null;
};

export type PublicNotice = {
  id: string;
  title: string;
  body: string;
  audience: "public" | "students" | "delegates";
  published: boolean;
  createdAt: string;
  createdBy: string;
};

export type DisputeRecord = {
  id: string;
  title: string;
  summary: string;
  relatedIncidentIds: string[];
  status: "open" | "under_review" | "closed";
  createdAt: string;
};

export type AppStore = {
  version: number;
  election: ElectionRecord;
  pollingStations: PollingStation[];
  candidates: CandidateRecord[];
  voterRegister: VoterRegister;
  notifications: NotificationItem[];
  auditLog: AuditEvent[];
  campuses: Campus[];
  schools: School[];
  departments: ElectoralDepartment[];
  programmes: Programme[];
  electoralUnits: ElectoralUnitConfiguration[];
  studentElectors: StudentElector[];
  studentMappings: StudentElectoralMapping[];
  delegateCandidates: DelegateCandidate[];
  delegateVotes: DelegateVote[];
  electedDelegates: ElectedDelegate[];
  electoralCollege: ElectoralCollegeRegister;
  cabinetCandidates: CabinetCandidate[];
  cabinetDrafts: CabinetBallotDraft[];
  cabinetVotes: CabinetVote[];
  assignments: AssignmentRecord[];
  incidents: IncidentRecord[];
  emergencies: EmergencyAction[];
  notices: PublicNotice[];
  disputes: DisputeRecord[];
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

export type ElectorSessionKind = "student" | "delegate";

export type ElectorSessionPayload = {
  kind: ElectorSessionKind;
  electorId: string;
  registrationNumber: string;
  fullName: string;
  electionId: string;
  lastActivityAt: number;
};
