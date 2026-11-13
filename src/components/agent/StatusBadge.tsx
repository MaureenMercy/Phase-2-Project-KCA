import { accreditationLabel, applicationLabel } from "@/lib/agent-access";
import type { AgentAccreditationStatus, AgentApplicationStatus } from "@/lib/types";

const ACCREDITATION_TONES: Record<AgentAccreditationStatus, string> = {
  ACCREDITED: "bg-emerald-100 text-emerald-900",
  PENDING: "bg-amber-100 text-amber-950",
  DECLINED: "bg-slate-200 text-slate-700",
  SUSPENDED: "bg-orange-100 text-orange-950",
  REVOKED: "bg-red-100 text-red-800",
};

export function StatusBadge({
  status,
  kind = "accreditation",
}: {
  status: AgentAccreditationStatus | AgentApplicationStatus | string;
  kind?: "accreditation" | "application";
}) {
  const label = kind === "application"
    ? applicationLabel(status as AgentApplicationStatus)
    : accreditationLabel(status as AgentAccreditationStatus);
  const tone =
    kind === "accreditation"
      ? ACCREDITATION_TONES[status as AgentAccreditationStatus] ?? "bg-slate-100 text-slate-700"
      : "bg-navy/10 text-navy";
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ${tone}`}>
      {label}
    </span>
  );
}

export function DemoModeBanner() {
  return (
    <p className="border-b border-gold/40 bg-gold px-4 py-1.5 text-center text-[11px] font-semibold tracking-[0.18em] text-navy uppercase">
      DEMO MODE — MOCK DATA ONLY
    </p>
  );
}
