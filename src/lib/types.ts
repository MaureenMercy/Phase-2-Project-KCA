export const STORE_VERSION = 6;

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
  "view_candidates",
  "approve_candidates",
  "lock_candidate_list",
  "approve_voter_register",
  "review_voter_exceptions",
  "decide_voter_exceptions",
  "assign_polling_stations",
  "manage_commission_records",
  "station_operations",
  "record_incidents",
  "view_incidents",
  "authorize_election_opening",
  "authorize_election_closing",
  "view_results",
  "reconcile_results",
  "authorize_results",
  "declare_results",
  "manage_media",
  "view_legal",
  "view_reports",
  "view_accessibility",
  "view_agents",
  "accredit_agents",
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
  frozen: boolean;
  frozenAt: string | null;
  frozenReason: string | null;
  openedAt: string | null;
  openedBy: string | null;
  closedAt: string | null;
  closedBy: string | null;
  closingNote: string | null;
};

export type StationElectionState = {
  electionId: string;
  stationId: string;
  status: StationState;
  votesCast: number;
  readiness: StationReadiness;
  frozen: boolean;
  openedAt: string | null;
  openedBy: string | null;
  closedAt: string | null;
  closedBy: string | null;
  closingNote: string | null;
};

export type CandidateRecord = {
  id: string;
  fullName: string;
  ticket: string;
  position: string;
  campus: string;
  contestId?: CabinetContestId;
  runningMateName?: string;
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

export const RESULTS_WORKFLOWS = [
  "NOT_STARTED",
  "GENERATED",
  "RECONCILED",
  "VERIFIED",
  "DECLARATION_AUTHORIZED",
  "DECLARED",
  "PUBLISHED",
] as const;

export type ResultsWorkflow = (typeof RESULTS_WORKFLOWS)[number];

export const ELECTION_CONTEXTS = [
  "ELECTION_1",
  "ELECTORAL_COLLEGE",
  "ELECTION_2",
] as const;

export type ElectionContext = (typeof ELECTION_CONTEXTS)[number];

export type ElectionRecord = {
  id: string;
  cycleId: string;
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
  closedBy: string | null;
  closingNote: string | null;
  closingExceptionUsed: boolean;
  resultsWorkflow: ResultsWorkflow;
  resultsAuthorizedAt: string | null;
  resultsAuthorizedBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export const ELECTORAL_STRUCTURES = [
  "DEPARTMENT",
  "SCHOOL",
  "CAMPUS_WIDE",
] as const;

export type ElectoralStructure = (typeof ELECTORAL_STRUCTURES)[number];

export type Campus = {
  id: string;
  name: string;
  code: string;
  electoralStructure: ElectoralStructure;
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
  schoolId: string | null;
  departmentId: string | null;
  programId: string | null;
  unitKind: ElectoralStructure;
  delegateSeats: number | null;
  seatStatus: "UNCONFIGURED" | "DRAFT" | "SUBMITTED" | "APPROVED";
  allocationSource: string | null;
  allocationVersion: string | null;
  allocationReviewNote: string | null;
  configurationVersionId: string;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
};

export type AccessibilityCategory =
  | "visual"
  | "hearing"
  | "mobility"
  | "cognitive"
  | "other";

export type AccessibilityProfile = {
  declared: boolean;
  categories: AccessibilityCategory[];
  accommodations: string[];
  notes: string;
  updatedAt: string | null;
  consentToShareOperationally: boolean;
};

export const IDENTITY_DOCUMENT_TYPES = [
  "NATIONAL_ID",
  "PASSPORT",
  "REFUGEE_ID",
] as const;

export type IdentityDocumentType = (typeof IDENTITY_DOCUMENT_TYPES)[number];

export type StudentElector = {
  id: string;
  studentId: string;
  fullName: string;
  gender: "F" | "M" | "X" | "UNSPECIFIED";
  yearOfStudy: number;
  campusId: string;
  schoolId: string;
  departmentId: string | null;
  programId: string | null;
  phone?: string;
  identityDocumentType?: IdentityDocumentType;
  nationalIdEncrypted?: string;
  nationalIdLast4?: string;
  eligibilityStatus: "eligible" | "ineligible" | "pending";
  eligibilitySource: "mock_first_year_register" | "operator_enrollment";
  election1Eligibility: "eligible" | "ineligible" | "pending";
  election1VotingStatus: "not_voted" | "voted";
  electedDelegateStatus: "not_applicable" | "pending_confirmation" | "elected" | "not_elected";
  electoralCollegeEligibility: "not_applicable" | "pending" | "eligible" | "ineligible";
  election2Eligibility: "not_applicable" | "pending" | "eligible" | "ineligible";
  election2VotingStatus: "not_applicable" | "not_voted" | "voted";
  verificationStatus: "unverified" | "verified" | "mismatch";
  courseLabel?: string;
  phoneNumber?: string;
  nationalIdCipher?: string;
  voterStatus: "not_voted" | "voted";
  accessibility: AccessibilityProfile;
  createdAt: string;
  updatedAt: string;
};

export const VOTER_REGISTRATION_STATUSES = [
  "DRAFT",
  "SUBMITTED",
  "PENDING_VERIFICATION",
  "VERIFIED",
  "REQUIRES_CORRECTION",
  "APPROVED_ELIGIBLE",
  "REJECTED",
] as const;

export type VoterRegistrationStatus = (typeof VOTER_REGISTRATION_STATUSES)[number];

export const ELECTION2_VOTER_STATUSES = [
  "AWAITING_DELEGATE_OUTCOME",
  "NOT_ELECTED",
  "PENDING_CONFIRMATION",
  "ELIGIBLE_DELEGATE",
  "UNDER_REVIEW",
] as const;

export type Election2VoterStatus = (typeof ELECTION2_VOTER_STATUSES)[number];

export const VOTER_HISTORY_KINDS = [
  "REGISTRATION_STARTED",
  "PHONE_VERIFIED",
  "ACADEMIC_VERIFIED",
  "REGISTRATION_SUBMITTED",
  "ELIGIBILITY_DECISION",
  "CORRECTION_REQUESTED",
  "CORRECTION_APPROVED",
  "EXCEPTION_CASE",
  "ELECTION1_PARTICIPATION",
  "DELEGATE_OUTCOME",
  "ELECTORAL_COLLEGE_INCLUSION",
  "ELECTION2_ELIGIBILITY",
  "ACCESSIBILITY_UPDATED",
  "ACCESSIBILITY_WITHDRAWN",
] as const;

export type VoterHistoryKind = (typeof VOTER_HISTORY_KINDS)[number];

export type IdentityDocumentPolicy = {
  allowedTypes: { id: string; label: string; enabled: boolean }[];
  pendingPolicyNote: string;
};

export type VoterProfile = {
  id: string;
  studentId: string;
  registrationReference: string | null;
  registrationStatus: VoterRegistrationStatus;
  registrationDate: string | null;
  submittedAt: string | null;
  phoneNumber: string;
  phoneVerifiedAt: string | null;
  identityDocumentType: string;
  identityDocumentLast4: string;
  electoralUnitId: string | null;
  electoralUnitPending: boolean;
  simulatedElection2Status: Election2VoterStatus | null;
  draftStep: number;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AcademicCorrectionRequest = {
  id: string;
  studentId: string;
  voterProfileId: string;
  reason: string;
  proposedCampusId: string | null;
  proposedSchoolId: string | null;
  proposedDepartmentId: string | null;
  proposedProgrammeId: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  submittedAt: string;
  decidedAt: string | null;
  decidedBy: string | null;
};

export type VoterHistoryEvent = {
  id: string;
  studentId: string;
  kind: VoterHistoryKind;
  title: string;
  detail: string;
  at: string;
};

export type VoterNotification = {
  id: string;
  studentId: string;
  title: string;
  body: string;
  href: string;
  read: boolean;
  createdAt: string;
};

export type StudentElectoralMapping = {
  studentId: string;
  electionId: string;
  electoralUnitId: string;
  campusId: string;
  schoolId: string | null;
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
  candidateId: string;
  candidateIds: string[];
  receiptReference: string;
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
  gender: StudentElector["gender"];
  rank: number;
  genderRuleApplied: boolean;
  genderRuleNote: string | null;
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
  sourceElectionId: string;
  version: number;
  status: "not_generated" | "draft" | "verified" | "active";
  generatedAt: string | null;
  verifiedAt: string | null;
  verifiedBy: string | null;
  approvedAt: string | null;
  approvedBy: string | null;
  entries: ElectoralCollegeEntry[];
};

export type ElectoralCollegeVersion = {
  version: number;
  snapshot: ElectoralCollegeRegister;
  createdAt: string;
  createdBy: string;
  reason: string;
};

export type CabinetCandidate = {
  id: string;
  studentId?: string;
  contestId: CabinetContestId;
  constitutionalOfficeId: string;
  fullName: string;
  photo: string;
  gender?: StudentElector["gender"];
  runningMateId?: string;
  runningMateStudentId?: string;
  runningMateName?: string;
  runningMatePhoto?: string;
  runningMateGender?: StudentElector["gender"];
  ticketLabel?: string;
  status: "approved";
};

export const CONSTITUTIONAL_OFFICES = [
  {
    id: "special-interest-secretary",
    contestId: "special-interests" as CabinetContestId,
    constitutionalTitle: "Special Interest Secretary",
    prototypeLabel: "Special Interests Secretary",
    namingDiscrepancy: true,
  },
  {
    id: "sports-entertainment-secretary",
    contestId: "sports" as CabinetContestId,
    constitutionalTitle: "Sports and Entertainment Secretary",
    prototypeLabel: "Sports & Entertainment Secretary",
    namingDiscrepancy: false,
  },
  {
    id: "academic-secretary",
    contestId: "academic" as CabinetContestId,
    constitutionalTitle: "Academic Secretary",
    prototypeLabel: "Academic Secretary",
    namingDiscrepancy: false,
  },
  {
    id: "treasurer",
    contestId: "treasurer" as CabinetContestId,
    constitutionalTitle: "Treasurer",
    prototypeLabel: "Treasurer / Finance Secretary",
    namingDiscrepancy: true,
  },
  {
    id: "secretary-general",
    contestId: "secretary-general" as CabinetContestId,
    constitutionalTitle: "Secretary General",
    prototypeLabel: "Secretary General",
    namingDiscrepancy: false,
  },
  {
    id: "chairperson-ticket",
    contestId: "president-ticket" as CabinetContestId,
    constitutionalTitle: "Chairperson + Vice Chairperson",
    prototypeLabel: "President + Vice President",
    namingDiscrepancy: true,
  },
] as const;

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
  receiptReference: string;
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
  kind: "photograph" | "video" | "document";
  uploadedAt: string;
  uploadedBy: string;
};

export type IncidentRecord = {
  id: string;
  electionId: string;
  stationId: string;
  reportedByWorkId: string;
  reportedByName: string;
  reporterRole: CommissionRole | "AGENT";
  reporterKind: "commission" | "agent";
  agentId?: string | null;
  linkedIncidentId?: string | null;
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
  scope: "STATION" | "ALL";
  stationIds: string[];
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

export type CandidateApplication = {
  id: string;
  studentId: string;
  fullName: string;
  electionKind: "DELEGATE" | "COUNCIL";
  electionId: string;
  positionLabel: string;
  contestId?: CabinetContestId;
  electoralUnitId: string | null;
  runningMateStudentId?: string | null;
  runningMateName?: string | null;
  photo: string;
  applicationStatus: "SUBMITTED" | "UNDER_REVIEW";
  vettingStatus: "PENDING" | "APPROVED" | "REJECTED";
  participationStatus: "NOT_SELECTED" | "SELECTED";
  verificationStatus: "NOT_SENT" | "SENT" | "VERIFIED" | "ISSUE_REPORTED";
  configurationStatus: "DRAFT" | "CONFIRMED" | "LOCKED";
  documents: { id: string; title: string; reference: string }[];
  vettingNotes: string;
  submittedAt: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
};

export type CandidateConfigurationLock = {
  electionId: string;
  status: "DRAFT" | "CONFIRMED" | "LOCKED";
  lockedAt: string | null;
  lockedBy: string | null;
};

export const AGENT_APPLICATION_STATUSES = [
  "DRAFT",
  "SUBMITTED",
  "UNDER_REVIEW",
  "APPROVED",
  "REJECTED",
] as const;

export type AgentApplicationStatus = (typeof AGENT_APPLICATION_STATUSES)[number];

export const AGENT_ACCREDITATION_STATUSES = [
  "PENDING",
  "ACCREDITED",
  "DECLINED",
  "SUSPENDED",
  "REVOKED",
] as const;

export type AgentAccreditationStatus = (typeof AGENT_ACCREDITATION_STATUSES)[number];

export const AGENT_INVITATION_STATUSES = [
  "OPEN",
  "USED",
  "EXPIRED",
  "REVOKED",
  "UNAVAILABLE",
] as const;

export type AgentInvitationStatus = (typeof AGENT_INVITATION_STATUSES)[number];

export type AgentInvitation = {
  id: string;
  reference: string;
  candidateApplicationId: string;
  candidateStudentId: string;
  candidateName: string;
  candidatePosition: string;
  candidatePhoto: string;
  electionId: string;
  invitedStudentId: string;
  invitedFullName: string;
  status: AgentInvitationStatus;
  expiresAt: string;
  createdAt: string;
  usedAt: string | null;
  usedByApplicationId: string | null;
  revokedAt: string | null;
  revokedReason: string | null;
};

export type AgentRecord = {
  id: string;
  agentCode: string;
  studentId: string;
  fullName: string;
  registrationNumber: string;
  passwordHash: string;
  phone: string;
  phoneVerifiedAt: string | null;
  invitationId: string | null;
  invitationReference: string | null;
  applicationReference: string;
  applicationStatus: AgentApplicationStatus;
  candidateApplicationId: string;
  candidateStudentId: string;
  candidateName: string;
  candidatePosition: string;
  candidatePhoto: string;
  electionId: string;
  nominationStatus: "NOMINATED" | "ACTIVATED";
  accreditationStatus: AgentAccreditationStatus;
  accreditationReference: string | null;
  requestedCampusId: string | null;
  requestedStationId: string | null;
  assignedCampusId: string | null;
  assignedStationId: string | null;
  permittedStationIds: string[];
  accessInstructions: string;
  conductAcknowledged: boolean;
  accuracyConfirmed: boolean;
  privacyAcknowledged: boolean;
  correctionRequest: string | null;
  correctionRequestAt: string | null;
  submittedAt: string | null;
  accreditedAt: string | null;
  accreditedBy: string | null;
  decisionNote: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AgentAttendance = {
  id: string;
  agentId: string;
  stationId: string;
  checkInAt: string | null;
  checkOutAt: string | null;
  recordedBy: string | null;
};

export type AgentObservation = {
  id: string;
  agentId: string;
  stationId: string;
  category: "process" | "technical" | "security" | "conduct" | "other";
  body: string;
  occurredAt: string;
  createdAt: string;
  linkedIncidentId: string | null;
  evidenceName?: string;
  evidenceType?: string;
};

export type AgentNotification = {
  id: string;
  agentId: string;
  studentId: string;
  title: string;
  body: string;
  href: string;
  createdAt: string;
  read: boolean;
  kind: "invitation" | "application" | "accreditation" | "station" | "instruction" | "report";
};

export type ObservationInstruction = {
  id: string;
  title: string;
  summary: string;
  body: string;
  publishedAt: string;
  downloadName: string;
};

export type AgentPolicy = {
  maxAgentsPerCandidate: number;
};

export type VoterException = {
  id: string;
  reference: string;
  studentId: string | null;
  fullName: string;
  registrationNumber: string;
  campusId: string;
  issue: "MISSING_FROM_REGISTER" | "RECORD_MISMATCH" | "DOCUMENTATION" | "OTHER";
  reason: string;
  verificationSource: string;
  status: "PENDING" | "MORE_INFO" | "APPROVED" | "REJECTED";
  submittedByWorkId: string;
  submittedByName: string;
  submittedAt: string;
  assignedReviewer: string | null;
  decisionNote: string | null;
  decidedBy: string | null;
  decidedAt: string | null;
  documents: { id: string; title: string; reference: string }[];
};

export type AccessibilityReadiness = {
  campusId: string;
  stationId: string;
  preparedCount: number;
  outstandingCount: number;
  notes: string;
  updatedAt: string;
};

export type ElectionResultRecord = {
  electionId: string;
  workflow: ResultsWorkflow;
  generatedAt: string | null;
  totals: { candidateId: string; fullName: string; votes: number; unitId?: string; contestId?: string }[];
  discrepancies: { id: string; detail: string; status: "open" | "resolved" }[];
  authorizedBy: string | null;
  declaredAt: string | null;
  publishedAt: string | null;
};

export type StructuralAuditEvent = {
  id: string;
  at: string;
  actorWorkId: string;
  actorName: string;
  entity: string;
  entityId: string;
  field: string;
  oldValue: string | null;
  newValue: string | null;
  reason: string;
  electionId: string;
  configurationVersionId: string | null;
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
  cycleId: string;
  election: ElectionRecord;
  elections: ElectionRecord[];
  activeElectionContext: ElectionContext;
  pollingStations: PollingStation[];
  stationElectionState: StationElectionState[];
  candidates: CandidateRecord[];
  voterRegister: VoterRegister;
  notifications: NotificationItem[];
  auditLog: AuditEvent[];
  structuralAudit: StructuralAuditEvent[];
  campuses: Campus[];
  schools: School[];
  departments: ElectoralDepartment[];
  programmes: Programme[];
  electoralUnits: ElectoralUnitConfiguration[];
  studentElectors: StudentElector[];
  studentMappings: StudentElectoralMapping[];
  candidateApplications: CandidateApplication[];
  candidateLocks: CandidateConfigurationLock[];
  delegateCandidates: DelegateCandidate[];
  delegateVotes: DelegateVote[];
  electedDelegates: ElectedDelegate[];
  electoralCollege: ElectoralCollegeRegister;
  electoralCollegeHistory: ElectoralCollegeVersion[];
  cabinetCandidates: CabinetCandidate[];
  cabinetDrafts: CabinetBallotDraft[];
  cabinetVotes: CabinetVote[];
  agents: AgentRecord[];
  agentInvitations: AgentInvitation[];
  agentNotifications: AgentNotification[];
  agentAttendance: AgentAttendance[];
  agentObservations: AgentObservation[];
  observationInstructions: ObservationInstruction[];
  agentPolicy: AgentPolicy;
  voterExceptions: VoterException[];
  voterProfiles: VoterProfile[];
  voterHistory: VoterHistoryEvent[];
  voterNotifications: VoterNotification[];
  academicCorrectionRequests: AcademicCorrectionRequest[];
  identityDocumentPolicy: IdentityDocumentPolicy;
  accessibilityReadiness: AccessibilityReadiness[];
  resultsByElection: ElectionResultRecord[];
  namingDiscrepancies: { officeId: string; note: string }[];
  policyFlags: { id: string; topic: string; status: "needs_confirmation"; detail: string }[];
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
