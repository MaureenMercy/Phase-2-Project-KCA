import { mockNationalId, mockPhone } from "@/lib/student-identity";

export const AGENT_PORTAL_HOST = "electionagent.kca.ac.ke";

export const AGENT_DEMO_CASES = [
  {
    label: "Register with a valid invitation",
    studentId: "24/05106",
    name: "Kevin Mutua Mwangi",
    invitation: "INV-OPEN-7K2M",
    notes: "Completes the five-step application. Accreditation stays pending until the Commission decides.",
  },
  {
    label: "Second valid invitation",
    studentId: "24/01204",
    name: "George Mwangi Njoroge",
    invitation: "INV-OPEN-8P4T",
    notes: "Issued by an approved Treasurer candidate.",
  },
  {
    label: "Expired invitation",
    studentId: "24/05107",
    name: "Pauline Chebet Kosgei",
    invitation: "INV-EXP-9Q1C",
    notes: "Shows a clear expired-invitation explanation.",
  },
  {
    label: "Revoked invitation",
    studentId: "24/05108",
    name: "Daniel Omondi Okello",
    invitation: "INV-REV-4H8P",
    notes: "Shows that the candidate withdrew the nomination.",
  },
  {
    label: "Already-used invitation",
    studentId: "24/05101",
    name: "Caroline Njeri Otieno",
    invitation: "INV-USED-2N6R",
    notes: "This nomination was already completed.",
  },
  {
    label: "Unavailable invitation",
    studentId: "24/03401",
    name: "Hassan Abdi Noor",
    invitation: "INV-UNAV-5D3W",
    notes: "The candidate is at the Commission agent limit.",
  },
  {
    label: "Approved agent",
    studentId: "24/05101",
    name: "Caroline Njeri Otieno",
    invitation: "AG-001",
    notes: "Town station observation, check-in and reporting.",
  },
  {
    label: "Pending accreditation",
    studentId: "24/05102",
    name: "Dennis Kiprono Langat",
    invitation: "AG-002",
    notes: "Can view status only. Observation is locked.",
  },
  {
    label: "Suspended agent",
    studentId: "24/05104",
    name: "Brian Otieno Wekesa",
    invitation: "AG-004",
    notes: "Observation and check-in are withdrawn.",
  },
  {
    label: "Revoked agent",
    studentId: "24/05105",
    name: "Lucy Wanjiku Maina",
    invitation: "AG-005",
    notes: "Accreditation withdrawn for the rest of the election.",
  },
].map((item) => ({
  ...item,
  nationalId: mockNationalId(item.studentId),
  phone: mockPhone(item.studentId),
}));
