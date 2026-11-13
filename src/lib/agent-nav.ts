import type { AgentCapability } from "@/lib/agent-access";

export type AgentNavItem = {
  href: string;
  label: string;
  capability: AgentCapability;
};

export type AgentNavGroup = {
  id: string;
  label: string;
  items: AgentNavItem[];
};

export const AGENT_NAV: AgentNavGroup[] = [
  {
    id: "overview",
    label: "Overview",
    items: [{ href: "/agent/home", label: "Dashboard", capability: "viewDashboard" }],
  },
  {
    id: "accreditation",
    label: "My Accreditation",
    items: [
      { href: "/agent/association", label: "Candidate Association", capability: "viewAssociation" },
      { href: "/agent/accreditation", label: "Accreditation Status", capability: "viewAccreditation" },
      { href: "/agent/station", label: "Polling Station Access", capability: "viewStation" },
    ],
  },
  {
    id: "activities",
    label: "Election Activities",
    items: [
      { href: "/agent/instructions", label: "Observation Instructions", capability: "viewInstructions" },
      { href: "/agent/attendance", label: "Attendance & Check-in", capability: "checkIn" },
      { href: "/agent/verification", label: "Candidate & Ballot Verification", capability: "verifyBallot" },
      { href: "/agent/observation", label: "Election Observation", capability: "observe" },
    ],
  },
  {
    id: "reports",
    label: "Reports & Updates",
    items: [
      { href: "/agent/report", label: "Submit Incident / Observation", capability: "reportIncident" },
      { href: "/agent/reports", label: "My Reports & Submissions", capability: "viewReports" },
      { href: "/agent/notifications", label: "Notifications", capability: "viewNotifications" },
    ],
  },
  {
    id: "account",
    label: "Account",
    items: [
      { href: "/agent/profile", label: "My Profile", capability: "viewProfile" },
      { href: "/agent/help", label: "Help & Support", capability: "viewProfile" },
    ],
  },
];

export const ACCREDITED_PATHS = [
  "/agent/attendance",
  "/agent/verification",
  "/agent/observation",
  "/agent/report",
];
