import Link from "next/link";
import { CampusSeatForm } from "@/components/commission/CampusSeatForm";
import type { ValidationIssue } from "@/lib/electoral";

export function OpeningChecklist({
  unconfigured,
  registerApproved,
  canConfigureSeats,
  issues,
}: {
  unconfigured: number;
  registerApproved: boolean;
  canConfigureSeats: boolean;
  issues: ValidationIssue[];
}) {
  const ready = unconfigured === 0;
  return (
    <section className="rounded-2xl border border-gold bg-white/90 p-6">
      <p className="text-[10px] tracking-[0.18em] text-gold-dim uppercase">
        How to open Election 1
      </p>
      <h2 className="mt-1 font-serif text-2xl text-navy">Opening is blocked until seats exist</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-navy/70">
        Saving the election name and date does <strong>not</strong> configure Election 1.
        Every electoral unit must have an explicit delegate-seat number first. Nothing is
        defaulted to 3.
      </p>
      <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-navy/75">
        <li>
          Allocate seats below, or open{" "}
          <Link className="font-semibold text-navy underline" href="/commission/election/election-1?tab=structure">
            Election → Electoral College → Electoral structure
          </Link>
          .
        </li>
        <li>Type a number (for the prototype, <strong>2</strong> is enough) and allocate remaining units.</li>
        <li>
          Return here and choose <strong>Authorize opening</strong>. Re-enter password{" "}
          <code className="rounded bg-cream px-1">KCAU@2026</code> when asked.
        </li>
      </ol>
      <ul className="mt-4 space-y-1 text-sm">
        <li className={ready ? "text-navy" : "text-red-800"}>
          {ready
            ? "Every active unit has a seat allocation."
            : `${unconfigured} unit${unconfigured === 1 ? "" : "s"} still need a seat number.`}
        </li>
        <li className={registerApproved ? "text-navy" : "text-navy/60"}>
          {registerApproved
            ? "Voter register is approved."
            : "Voter register is submitted but not yet approved (optional for opening)."}
        </li>
      </ul>
      {issues.length > 0 ? (
        <ul className="mt-3 list-disc pl-5 text-xs text-navy/60">
          {issues.slice(0, 5).map((issue) => (
            <li key={`${issue.code}-${issue.unitId ?? issue.message}`}>{issue.message}</li>
          ))}
          {issues.length > 5 ? <li>…and {issues.length - 5} more.</li> : null}
        </ul>
      ) : null}
      {canConfigureSeats && unconfigured > 0 ? (
        <div className="mt-4">
          <CampusSeatForm campusName="all remaining units" />
        </div>
      ) : null}
      <p className="mt-4 text-xs text-navy/50">
        Full walkthrough:{" "}
        <Link className="font-semibold text-navy underline" href="/commission/guide">
          Chair operations guide
        </Link>
        .
      </p>
    </section>
  );
}
