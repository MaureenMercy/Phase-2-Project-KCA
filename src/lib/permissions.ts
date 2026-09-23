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
  approve_candidates: "Approve or reject candidate nominations",
  approve_voter_register: "Approve the official voter register",
  assign_polling_stations: "Assign commissioners to polling stations",
  manage_commission_records: "Manage commission records and minutes",
  station_operations: "Perform assigned polling-station duties",
  record_incidents: "Record election-day incidents and evidence",
  view_incidents: "View the central incident log",
  authorize_election_opening: "Authorize opening of the election",
  authorize_election_closing: "Authorize closing of voting",
  view_results: "View results after voting closes",
  authorize_results: "Authorize official election results",
  manage_media: "Prepare public notices and voter education",
  view_legal: "View legal and dispute records",
  view_reports: "View electoral reports",
  view_accessibility: "View accessibility settings",
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
  CHAIR: [...ELECTORAL_PERMISSIONS],
  VICE_CHAIR: ELECTORAL_PERMISSIONS.filter(
    (permission) => permission !== "authorize_results",
  ),
  SECRETARY_GENERAL: [
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
    "view_results",
    "manage_media",
    "view_legal",
    "view_reports",
    "view_accessibility",
    "view_audit_trail",
  ],
  COMMISSIONER: [
    "view_dashboard",
    "approve_candidates",
    "station_operations",
    "record_incidents",
    "view_incidents",
    "view_results",
    "view_legal",
    "view_reports",
    "view_accessibility",
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
  "view_audit_trail",
];

const STAGE_PERMISSIONS: Record<ElectionStage, ElectoralPermission[]> = {
  REGISTRATION: [
    ...ALWAYS_ON,
    "configure_election",
    "configure_delegate_seats",
    "approve_candidates",
    "approve_voter_register",
    "assign_polling_stations",
    "manage_media",
    "authorize_election_opening",
    "initiate_emergency",
    "authorize_emergency",
  ],
  VOTING: [
    ...ALWAYS_ON,
    "approve_candidates",
    "station_operations",
    "record_incidents",
    "manage_media",
    "authorize_election_closing",
    "initiate_emergency",
    "authorize_emergency",
  ],
  CLOSED: [
    ...ALWAYS_ON,
    "configure_delegate_seats",
    "view_results",
    "authorize_results",
    "manage_media",
    "initiate_emergency",
    "authorize_emergency",
  ],
  CERTIFIED: [
    ...ALWAYS_ON,
    "view_results",
    "manage_media",
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
  ELECTION_1_DELEGATE: "Electoral College",
  SAKU_LEADERSHIP: "SAKU Leadership Election",
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
