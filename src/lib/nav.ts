import type { ElectoralPermission } from "@/lib/types";

export type NavItem = {
  href: string;
  label: string;
  permission: ElectoralPermission;
  description: string;
};

export const COMMISSION_NAV: NavItem[] = [
  {
    href: "/commission/dashboard",
    label: "Dashboard",
    permission: "view_dashboard",
    description: "Election command overview",
  },
  {
    href: "/commission/candidates",
    label: "Candidates",
    permission: "approve_candidates",
    description: "Nominations and approvals",
  },
  {
    href: "/commission/voter-register",
    label: "Voter register",
    permission: "approve_voter_register",
    description: "Official voter roll",
  },
  {
    href: "/commission/election-control",
    label: "Election control",
    permission: "view_dashboard",
    description: "Open, monitor, and close voting",
  },
  {
    href: "/commission/results",
    label: "Results",
    permission: "view_results",
    description: "Tabulation and authorization",
  },
  {
    href: "/commission/polling-stations",
    label: "Polling stations",
    permission: "station_operations",
    description: "Station assignment and status",
  },
  {
    href: "/commission/members",
    label: "Commission",
    permission: "view_dashboard",
    description: "Members and authority levels",
  },
  {
    href: "/commission/audit",
    label: "Audit trail",
    permission: "view_audit_trail",
    description: "Electoral actions log",
  },
];
