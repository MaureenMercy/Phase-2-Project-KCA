import type { CommissionRole } from "@/lib/types";
import { COMMISSION_MEMBERS, INSTITUTIONAL_DIRECTORY } from "@/lib/seed";
import { ROLE_LABELS } from "@/lib/permissions";

export function initials(name: string) {
  return name
    .split(" ")
    .filter((part) => !["Prof.", "Dr.", "Ms.", "Mr.", "Eng."].includes(part))
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function formatDateTime(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-KE").format(value);
}

export function memberDirectory() {
  return COMMISSION_MEMBERS.map((member) => {
    const user = INSTITUTIONAL_DIRECTORY.find((item) => item.id === member.userId);
    return {
      ...member,
      fullName: user?.fullName ?? "Unknown",
      workId: user?.workId ?? "",
      email: user?.email ?? "",
      roleLabel: ROLE_LABELS[member.role as CommissionRole],
    };
  });
}
