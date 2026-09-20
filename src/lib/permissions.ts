import type {
  CommissionRole,
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
  approve_candidates: "Approve or reject candidate nominations",
  approve_voter_register: "Approve the official voter register",
  assign_polling_stations: "Assign commissioners to polling stations",
  manage_commission_records: "Manage commission records and minutes",
  station_operations: "Perform assigned polling-station duties",
  authorize_election_opening: "Authorize opening of the election",
  authorize_election_closing: "Authorize closing of voting",
  view_results: "View results after voting closes",
  authorize_results: "Authorize official election results",
  view_audit_trail: "View the electoral audit trail",
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
    "approve_candidates",
    "approve_voter_register",
    "assign_polling_stations",
    "manage_commission_records",
    "station_operations",
    "view_results",
    "view_audit_trail",
  ],
  COMMISSIONER: [
    "view_dashboard",
    "approve_candidates",
    "station_operations",
    "view_results",
    "view_audit_trail",
  ],
};

const STAGE_PERMISSIONS: Record<ElectionStage, ElectoralPermission[]> = {
  REGISTRATION: [
    "view_dashboard",
    "approve_candidates",
    "approve_voter_register",
    "assign_polling_stations",
    "manage_commission_records",
    "authorize_election_opening",
    "view_audit_trail",
  ],
  VOTING: [
    "view_dashboard",
    "station_operations",
    "manage_commission_records",
    "authorize_election_closing",
    "view_audit_trail",
  ],
  CLOSED: [
    "view_dashboard",
    "manage_commission_records",
    "view_results",
    "authorize_results",
    "view_audit_trail",
  ],
  CERTIFIED: [
    "view_dashboard",
    "manage_commission_records",
    "view_results",
    "view_audit_trail",
  ],
};

export const HIGH_RISK_PERMISSIONS: ElectoralPermission[] = [
  "authorize_election_opening",
  "authorize_election_closing",
  "authorize_results",
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
