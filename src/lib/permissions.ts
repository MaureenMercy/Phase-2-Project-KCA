import type {
  CommissionRole,
  ElectionContest,
  ElectionStage,
  ElectoralPermission,
} from "@/lib/types";
import { ELECTORAL_PERMISSIONS, TECHNICAL_PERMISSIONS } from "@/lib/types";

export const ROLE_LABELS: Record<CommissionRole, string> = {
  CHAIR: "Commission Chair",
  VICE_CHAIR: "Vice Chair",
  SECRETARY_GENERAL: "Secretary General",
  COMMISSIONER: "Commissioner",
};

export const PERMISSION_LABELS: Record<ElectoralPermission, string> = {
  view_dashboard: "View Electoral Commission dashboard",
  configure_election: "Configure election structure and dates",
  configure_delegate_seats: "Configure delegate seat allocations",
  view_candidates: "View candidate applications and registers",
  approve_candidates: "Approve or reject candidate nominations",
  lock_candidate_list: "Lock the final candidate configuration",
  approve_voter_register: "Approve the official voter register",
  review_voter_exceptions: "Review voter exception cases",
  decide_voter_exceptions: "Approve or reject voter exceptions",
  assign_polling_stations: "Assign commissioners to polling stations",
  manage_commission_records: "Manage commission records and minutes",
  station_operations: "Perform assigned polling-station duties",
  record_incidents: "Record election-day incidents and evidence",
  view_incidents: "View the central incident log",
  authorize_election_opening: "Authorize opening of the election",
  authorize_election_closing: "Authorize closing of voting",
  view_results: "View results after voting closes",
  reconcile_results: "Reconcile generated result totals",
  authorize_results: "Authorize official election results",
  declare_results: "Declare authorized election results",
  manage_media: "Prepare public notices and voter education",
  view_legal: "View legal and dispute records",
  view_reports: "View electoral reports",
  view_accessibility: "View accessibility settings",
  view_agents: "View agent nominations and accreditation records",
  accredit_agents: "Approve or decline agent accreditation",
  view_audit_trail: "View the electoral audit trail",
  initiate_emergency: "Initiate an election emergency pause or resume",
  authorize_emergency: "Authorize a pending emergency action",
};

export const TECHNICAL_PERMISSION_LABELS: Record<
  (typeof TECHNICAL_PERMISSIONS)[number],
  string
> = {
  modify_server_configuration: "Modify server configuration",
  alter_databases: "Alter databases",
  deploy_software: "Deploy software",
  manage_backups_recovery: "Manage backups and recovery",
  view_raw_security_logs: "Access raw security logs",
  manage_technical_incidents: "Manage technical incidents",
};

const ROLE_PERMISSIONS: Record<CommissionRole, ElectoralPermission[]> = {
  CHAIR: ELECTORAL_PERMISSIONS.filter((permission) => permission !== "station_operations"),
  VICE_CHAIR: ELECTORAL_PERMISSIONS.filter(
    (permission) =>
      permission !== "authorize_results" &&
      permission !== "declare_results" &&
      permission !== "station_operations",
  ),
  SECRETARY_GENERAL: [
    "view_dashboard",
    "configure_election",
    "configure_delegate_seats",
    "view_candidates",
    "approve_voter_register",
    "review_voter_exceptions",
    "assign_polling_stations",
    "manage_commission_records",
    "record_incidents",
    "view_incidents",
    "view_results",
    "reconcile_results",
    "manage_media",
    "view_legal",
    "view_reports",
    "view_accessibility",
    "view_agents",
    "view_audit_trail",
  ],
  COMMISSIONER: [
    "view_dashboard",
    "view_candidates",
    "review_voter_exceptions",
    "station_operations",
    "record_incidents",
    "view_incidents",
    "view_results",
    "view_legal",
    "view_reports",
    "view_accessibility",
    "view_agents",
    "view_audit_trail",
  ],
};

const ALWAYS_ON: ElectoralPermission[] = [
  "view_dashboard",
  "manage_commission_records",
  "view_incidents",
  "view_legal",
  "view_reports",
  "view_accessibility",
  "view_candidates",
  "view_agents",
  "review_voter_exceptions",
  "view_audit_trail",
];

const STAGE_PERMISSIONS: Record<ElectionStage, ElectoralPermission[]> = {
  REGISTRATION: [
    ...ALWAYS_ON,
    "configure_election",
    "configure_delegate_seats",
    "approve_candidates",
    "lock_candidate_list",
    "approve_voter_register",
    "decide_voter_exceptions",
    "assign_polling_stations",
    "manage_media",
    "accredit_agents",
    "authorize_election_opening",
    "initiate_emergency",
    "authorize_emergency",
  ],
  VOTING: [
    ...ALWAYS_ON,
    "station_operations",
    "record_incidents",
    "manage_media",
    "view_results",
    "configure_election",
    "approve_voter_register",
    "decide_voter_exceptions",
    "accredit_agents",
    "authorize_election_closing",
    "initiate_emergency",
    "authorize_emergency",
  ],
  CLOSED: [
    ...ALWAYS_ON,
    "configure_delegate_seats",
    "view_results",
    "reconcile_results",
    "authorize_results",
    "declare_results",
    "manage_media",
    "initiate_emergency",
    "authorize_emergency",
  ],
  CERTIFIED: [
    ...ALWAYS_ON,
    "view_results",
    "manage_media",
    "declare_results",
  ],
};

export const HIGH_RISK_PERMISSIONS: ElectoralPermission[] = [
  "authorize_election_opening",
  "authorize_election_closing",
  "authorize_results",
  "initiate_emergency",
  "authorize_emergency",
];

export function permissionsForRole(
  role: CommissionRole,
): ElectoralPermission[] {
  return ROLE_PERMISSIONS[role];
}

export function roleHasPermission(
  role: CommissionRole,
  permission: ElectoralPermission,
): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function isAllowedNow(
  role: CommissionRole,
  permission: ElectoralPermission,
  stage: ElectionStage,
): boolean {
  return (
    roleHasPermission(role, permission) &&
    STAGE_PERMISSIONS[stage].includes(permission)
  );
}

export function activePermissions(
  role: CommissionRole,
  stage: ElectionStage,
): ElectoralPermission[] {
  return ROLE_PERMISSIONS[role].filter((permission) =>
    STAGE_PERMISSIONS[stage].includes(permission),
  );
}

export function stageBlockedPermissions(
  role: CommissionRole,
  stage: ElectionStage,
): ElectoralPermission[] {
  return ROLE_PERMISSIONS[role].filter(
    (permission) => !STAGE_PERMISSIONS[stage].includes(permission),
  );
}

export function isHighRisk(permission: ElectoralPermission): boolean {
  return HIGH_RISK_PERMISSIONS.includes(permission);
}

export function technicalPermissionsForCommission(): readonly string[] {
  return TECHNICAL_PERMISSIONS;
}

export const STAGE_LABELS: Record<ElectionStage, string> = {
  REGISTRATION: "Registration period",
  VOTING: "Voting in progress",
  CLOSED: "Voting concluded — results pending authorization",
  CERTIFIED: "Official results authorized",
};

export const CONTEST_LABELS: Record<ElectionContest, string> = {
  ELECTION_1_DELEGATE: "Election 1 — Delegates Election",
  SAKU_LEADERSHIP: "Election 2 — SAKU Council Election",
};

export function landingStatusMessage(stage: ElectionStage, year: number) {
  switch (stage) {
    case "REGISTRATION":
      return `SAKU Elections ${year} — Registration Period Open`;
    case "VOTING":
      return `SAKU Elections ${year} — Voting is currently in progress.`;
    case "CLOSED":
      return `SAKU Elections ${year} — Voting has concluded. Results pending authorization.`;
    case "CERTIFIED":
      return `SAKU Elections ${year} — Official results have been authorized.`;
  }
}

export function canSeeEmergency(role: CommissionRole) {
  return (
    roleHasPermission(role, "initiate_emergency") ||
    roleHasPermission(role, "authorize_emergency")
  );
}
