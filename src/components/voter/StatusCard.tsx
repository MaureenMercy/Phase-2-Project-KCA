import { StatusPill } from "@/components/commission/PageHeader";
import { REGISTRATION_STATUS_COPY } from "@/lib/voter";
import type { VoterRegistrationStatus } from "@/lib/types";

export function RegistrationStatusCard({ status }: { status: VoterRegistrationStatus }) {
  const copy = REGISTRATION_STATUS_COPY[status];
  return (
    <article className="rounded-2xl border border-navy/10 bg-white/90 p-5">
      <p className="text-[10px] tracking-[0.18em] text-navy/40 uppercase">Verification status</p>
      <div className="mt-2">
        <StatusPill tone={copy.tone}>{copy.label}</StatusPill>
      </div>
      <p className="mt-3 text-sm leading-6 text-navy/70">{copy.meaning}</p>
    </article>
  );
}
