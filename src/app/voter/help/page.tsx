import Link from "next/link";
import { DemoBanner } from "@/components/commission/DemoBanner";
import { PageHeader } from "@/components/commission/PageHeader";
import { SupportForm } from "@/components/voter/SupportForm";
import { VoterShell } from "@/components/voter/VoterShell";
import { ELECTION2_STATUS_COPY, REGISTRATION_STATUS_COPY } from "@/lib/voter";
import { loadVoterContext } from "@/lib/voter-guard";
import { readStore } from "@/lib/store";

export const dynamic = "force-dynamic";
export const metadata = { title: "Help & Support" };

export default async function VoterHelpPage() {
  const store = await readStore();
  const context = await loadVoterContext();
  const body = (
    <div className="space-y-6">
      <PageHeader eyebrow="Help & Support" title="How the Voter Portal works">
        Plain-language answers for students. This portal does not issue a home ballot.
      </PageHeader>
      {!context ? (
        <p>
          <Link href="/voter" className="text-sm text-navy underline">
            Back to Voter Portal
          </Link>
        </p>
      ) : null}
      <article className="rounded-2xl border border-navy/10 bg-white p-6">
        <h2 className="font-serif text-2xl">What you can do here</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-6 text-navy/75">
          <li>Register using your student identity and a simulated phone code.</li>
          <li>See your campus, school, department and Electoral College mapping.</li>
          <li>Ask for an academic correction if the record is wrong.</li>
          <li>Optionally tell us about voting assistance.</li>
          <li>Track registration, eligibility and Election 2 delegate status.</li>
        </ul>
      </article>
      <article className="rounded-2xl border border-navy/10 bg-white p-6">
        <h2 className="font-serif text-2xl">What this portal cannot do</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-6 text-navy/75">
          <li>Let you vote from home or open an unrestricted remote ballot.</li>
          <li>Let you change verified academic information yourself.</li>
          <li>Let you approve your own eligibility or add yourself to the Electoral College Register.</li>
          <li>Show anyone’s ballot choices, including your own.</li>
        </ul>
      </article>
      <article className="rounded-2xl border border-navy/10 bg-white p-6">
        <h2 className="font-serif text-2xl">Registration statuses</h2>
        <dl className="mt-3 space-y-3 text-sm">
          {Object.entries(REGISTRATION_STATUS_COPY).map(([status, copy]) => (
            <div key={status}>
              <dt className="font-semibold text-navy">{copy.label}</dt>
              <dd className="text-navy/70">{copy.meaning}</dd>
            </div>
          ))}
        </dl>
      </article>
      <article className="rounded-2xl border border-navy/10 bg-white p-6">
        <h2 className="font-serif text-2xl">Election 2 statuses</h2>
        <dl className="mt-3 space-y-3 text-sm">
          {Object.entries(ELECTION2_STATUS_COPY).map(([status, copy]) => (
            <div key={status}>
              <dt className="font-semibold text-navy">{copy.label}</dt>
              <dd className="text-navy/70">{copy.meaning}</dd>
            </div>
          ))}
        </dl>
      </article>
      <article className="rounded-2xl border border-navy/10 bg-white p-6">
        <h2 className="font-serif text-2xl">Student record not found</h2>
        <p className="mt-2 text-sm leading-6 text-navy/70">
          If your registration number is not on the mock student register, ORBIS will not create a second identity.
          Send a support request so an authorized officer can check the institutional record.
        </p>
        <div className="mt-4">
          <SupportForm campuses={store.campuses.map((item) => ({ id: item.id, name: item.name }))} />
        </div>
      </article>
    </div>
  );

  if (!context) {
    return (
      <main className="min-h-screen bg-cream text-navy">
        <DemoBanner />
        <div className="mx-auto max-w-4xl px-4 py-8">{body}</div>
      </main>
    );
  }

  const notifications = context.store.voterNotifications.filter((item) => item.studentId === context.student.studentId);
  const accommodations = context.student.accessibility.accommodations.map((item) => item.toLowerCase());
  return (
    <VoterShell
      fullName={context.student.fullName}
      studentId={context.student.studentId}
      notifications={notifications}
      largeText={accommodations.some((item) => item.includes("larger") || item === "larger-text")}
      highContrast={accommodations.some((item) => item.includes("high-contrast") || item === "high-contrast")}
    >
      {body}
    </VoterShell>
  );
}
