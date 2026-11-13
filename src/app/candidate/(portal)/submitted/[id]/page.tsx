import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/candidate/StatusBadge";
import { electionTypeLabel, statusExplanation } from "@/lib/candidate-portal";
import { requireCandidateSession } from "@/lib/candidate-session";
import { normalizeStudentId } from "@/lib/student-auth";
import { readStore } from "@/lib/store";

export const metadata = { title: "Application sent" };

export default async function SubmittedPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireCandidateSession();
  const store = await readStore();
  const application = store.candidatePortalApplications.find((item) => item.id === id);
  if (!application || normalizeStudentId(application.studentId) !== normalizeStudentId(session.studentId)) {
    notFound();
  }

  return (
    <div className="candidate-card max-w-2xl p-8">
      <StatusBadge status={application.status} />
      <h1 className="mt-4 font-serif text-4xl text-navy">Application received</h1>
      <p className="mt-3 text-lg text-navy/80">
        Your {electionTypeLabel(application.applicationType)} application has been sent.
      </p>
      <p className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-navy">
        Reference <strong>{application.reference ?? "—"}</strong>
      </p>
      <p className="mt-4 text-sm leading-6 text-navy/70">{statusExplanation(application.status)}</p>
      <p className="mt-2 text-sm leading-6 text-navy/70">
        Approval is a separate Commission decision. Being approved does not automatically place you
        on an official ballot.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href={`/candidate/applications/${application.id}`}
          className="rounded-xl bg-navy px-4 py-3 text-sm font-semibold text-white"
        >
          Track this application
        </Link>
        <Link href="/candidate/dashboard" className="rounded-xl border border-navy px-4 py-3 text-sm font-semibold text-navy">
          Dashboard
        </Link>
      </div>
    </div>
  );
}
