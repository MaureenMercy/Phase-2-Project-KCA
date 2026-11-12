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
    href: "/commission/election",
    label: "Election Management",
    icon: "🗳",
    permission: "view_dashboard",
    description: "Two-election lifecycle",
  },
  {
    href: "/commission/voters",
    label: "Voter Management",
    icon: "👥",
    permission: "view_dashboard",
    description: "Registers and exceptions",
  },
  {
    href: "/commission/accessibility",
    label: "Accessibility",
    icon: "♿",
    permission: "view_accessibility",
    description: "Station accommodation",
  },
  {
    href: "/commission/candidates",
    label: "Candidate Management",
    icon: "🎓",
    permission: "view_candidates",
    description: "Applications and vetting",
  },
  {
    href: "/commission/agents",
    label: "Agent Management",
    icon: "🪪",
    permission: "view_agents",
    description: "Nomination and accreditation",
  },
  {
    href: "/commission/stations",
    label: "Electoral Units & Stations",
    icon: "📍",
    permission: "view_dashboard",
    description: "Units, stations, assignments",
  },
  {
    href: "/commission/incidents",
    label: "Incidents & Escalations",
    icon: "🚨",
    permission: "view_incidents",
    description: "Station log and evidence",
  },
  {
    href: "/commission/reports",
    label: "Reports",
    icon: "📑",
    permission: "view_reports",
    description: "Electoral reports",
  },
  {
    href: "/commission/audit",
    label: "Audit Trail",
    icon: "🔐",
    permission: "view_audit_trail",
    description: "Electoral action log",
  },
  {
    href: "/commission/legal",
    label: "Legal & Disputes",
    icon: "⚖",
    permission: "view_legal",
    description: "Disputes and records",
  },
  {
    href: "/commission/media",
    label: "Announcements & Public Information",
    icon: "📺",
    permission: "view_reports",
    description: "Notices and voter education",
  },
  {
    href: "/commission/emergency",
    label: "Emergency Election Control",
    icon: "🛑",
    permission: "initiate_emergency",
    description: "Restricted freeze control",
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
