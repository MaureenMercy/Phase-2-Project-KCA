import type { ElectoralPermission } from "@/lib/types";

export type NavItem = {
  href: string;
  label: string;
  icon: string;
  permission: ElectoralPermission;
  description: string;
  kind?: "standard" | "restricted";
};

export const COMMISSION_NAV: NavItem[] = [
  {
    href: "/commission/dashboard",
    label: "Dashboard",
    icon: "▣",
    permission: "view_dashboard",
    description: "Command overview",
  },
  {
    href: "/commission/voters",
    label: "Voters",
    icon: "👥",
    permission: "view_dashboard",
    description: "Register and eligibility",
  },
  {
    href: "/commission/candidates",
    label: "Candidates",
    icon: "🎓",
    permission: "approve_candidates",
    description: "Nominations and vetting",
  },
  {
    href: "/commission/stations",
    label: "Stations",
    icon: "📍",
    permission: "view_dashboard",
    description: "Units and assignments",
  },
  {
    href: "/commission/election",
    label: "Election",
    icon: "🗳",
    permission: "view_dashboard",
    description: "Lifecycle and structure",
  },
  {
    href: "/commission/incidents",
    label: "Incidents",
    icon: "🚨",
    permission: "view_incidents",
    description: "Station log and evidence",
  },
  {
    href: "/commission/media",
    label: "Media",
    icon: "📺",
    permission: "view_reports",
    description: "Public information",
  },
  {
    href: "/commission/legal",
    label: "Legal",
    icon: "⚖",
    permission: "view_legal",
    description: "Disputes and records",
  },
  {
    href: "/commission/reports",
    label: "Reports",
    icon: "📑",
    permission: "view_reports",
    description: "Electoral reports",
  },
  {
    href: "/commission/accessibility",
    label: "Accessibility",
    icon: "♿",
    permission: "view_accessibility",
    description: "Access settings",
  },
  {
    href: "/commission/audit",
    label: "Audit trail",
    icon: "🔐",
    permission: "view_audit_trail",
    description: "Electoral action log",
  },
  {
    href: "/commission/emergency",
    label: "Emergency",
    icon: "🛑",
    permission: "initiate_emergency",
    description: "Restricted pause control",
    kind: "restricted",
  },
];

export function navForPermissions(permissions: ElectoralPermission[]) {
  return COMMISSION_NAV.filter(
    (item) =>
      permissions.includes(item.permission) ||
      (item.kind === "restricted" &&
        (permissions.includes("initiate_emergency") ||
          permissions.includes("authorize_emergency"))),
  );
}
