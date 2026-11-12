import Link from "next/link";
import { PageHeader, StatCard, StatusPill } from "@/components/commission/PageHeader";
import { RegistrationStatusCard } from "@/components/voter/StatusCard";
import { formatDateTime } from "@/lib/format";
import { dashboardFrom, requireRegisteredVoter } from "@/lib/voter-guard";
import { ELECTION2_STATUS_COPY, pollingInstructions } from "@/lib/voter";

export const dynamic = "force-dynamic";
export const metadata = { title: "Voter dashboard" };

export default async function VoterDashboardPage() {
  const context = await requireRegisteredVoter();
  const model = dashboardFrom(context);
  const instructions = pollingInstructions(context.store, context.student);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Dashboard" title={`Hello, ${context.student.fullName.split(" ")[0]}`}>
        This portal is for registration and your voter account. It does not open a home ballot.
      </PageHeader>

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Registration reference"
          value={model.profile.registrationReference ?? "Not issued"}
          hint={model.profile.registrationDate ? `Registered ${formatDateTime(model.profile.registrationDate)}` : "Draft or not submitted"}
        />
        <RegistrationStatusCard status={model.profile.registrationStatus} />
        <article className="rounded-2xl border border-navy/10 bg-white/90 p-5">
          <p className="text-[10px] tracking-[0.18em] text-navy/40 uppercase">Eligibility</p>
          <div className="mt-2">
            <StatusPill tone={model.election1Eligible ? "ok" : "gold"}>
              {model.election1Eligible ? "Eligible for Election 1" : "Not yet an approved elector"}
            </StatusPill>
          </div>
          <p className="mt-3 text-sm text-navy/70">
            Submitting a form is not the same as being approved to vote.
          </p>
        </article>
      </section>

      {model.actions.length > 0 ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="font-serif text-xl text-navy">Outstanding actions</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-950">
            {model.actions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-navy/10 bg-white p-6">
          <h2 className="font-serif text-2xl text-navy">My Academic Information</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <Row label="Campus" value={model.academic.campusName} />
            <Row label="School" value={model.academic.schoolName} />
            <Row label="Programme / course" value={model.courseLabel} />
            <Row label="Department" value={model.academic.departmentName ?? "Not mapped at this campus"} />
            <Row label="Electoral unit" value={model.unitPending ? "Pending authorized configuration" : model.unitLabel ?? "Pending"} />
          </dl>
          <Link href="/voter/registration" className="mt-4 inline-block text-sm text-navy underline">
            Request a correction
          </Link>
        </article>
        <article className="rounded-2xl border border-navy/10 bg-white p-6">
          <h2 className="font-serif text-2xl text-navy">My Polling Station</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <Row label="Assigned campus" value={model.academic.campusName} />
            <Row label="Designated polling station" value={model.station?.name ?? "Not configured by the Commission"} />
            <Row label="Election 1 date" value={model.electionOne.electionDate || "Not configured"} />
            <Row label="Configured hours" value={`${model.electionOne.startTime}–${model.electionOne.endTime}`} />
          </dl>
          <ul className="mt-4 space-y-2 text-sm leading-6 text-navy/70">
            {instructions.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-navy/10 bg-white p-6">
          <h2 className="font-serif text-2xl text-navy">Election 1 — Delegates</h2>
          <p className="mt-2 text-sm text-navy/60">{model.electionOne.name}</p>
          <dl className="mt-4 space-y-2 text-sm">
            <Row label="Voter eligibility" value={model.election1Eligible ? "Eligible" : "Not yet approved"} />
            <Row label="Electoral College" value={model.unitPending ? "Pending configuration" : model.unitLabel ?? "Pending"} />
            <Row label="Participation" value={model.election1Participation} />
          </dl>
          <p className="mt-3 text-xs text-navy/50">Your candidate selection is never shown here.</p>
        </article>
        <article className="rounded-2xl border border-navy/10 bg-white p-6">
          <h2 className="font-serif text-2xl text-navy">Election 2 — SAKU Council</h2>
          <p className="mt-2 text-sm text-navy/60">{model.electionTwo.name}</p>
          <p className="mt-3 font-semibold text-navy">{ELECTION2_STATUS_COPY[model.election2Status].label}</p>
          <p className="mt-1 text-sm leading-6 text-navy/70">{model.election2Copy.meaning}</p>
        </article>
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-navy/5 py-1.5">
      <dt className="text-navy/50">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}
