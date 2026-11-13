import type { CandidateApplicationStatus } from "@/lib/types";

const STYLES: Record<CandidateApplicationStatus, string> = {
  Draft: "bg-slate-100 text-slate-700",
  Submitted: "bg-sky-50 text-sky-800",
  "Under Review": "bg-indigo-50 text-indigo-800",
  "Awaiting Additional Information": "bg-amber-50 text-amber-900",
  Approved: "bg-emerald-50 text-emerald-800",
  Rejected: "bg-rose-50 text-rose-800",
};

export function StatusBadge({ status }: { status: CandidateApplicationStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase ${STYLES[status]}`}
    >
      {status}
    </span>
  );
}
