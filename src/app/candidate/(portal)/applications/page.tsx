import Link from "next/link";
import { StatusBadge } from "@/components/candidate/StatusBadge";
import {
  ballotParticipationLabel,
  electionTypeLabel,
  statusExplanation,
  applicationsForStudent,
} from "@/lib/candidate-portal";
import { requireCandidateSession } from "@/lib/candidate-session";
import { formatDateTime } from "@/lib/format";
import { readStore } from "@/lib/store";

export const metadata = { title: "My applications" };

export default async function ApplicationsPage() {
  const session = await requireCandidateSession();
  const store = await readStore();
  const applications = applicationsForStudent(store, session.studentId);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-4xl text-navy">My applications</h1>
        <p className="mt-2 max-w-2xl text-navy/70">
          Track each application separately from ballot configuration. An approved candidate is not
          automatically placed on an official ballot.
        </p>
      </header>
      {applications.length === 0 ? (
        <p className="candidate-card p-6 text-navy/70">You have not started an application yet.</p>
      ) : (
        <ul className="space-y-4">
          {applications.map((application) => (
            <li key={application.id} className="candidate-card p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <StatusBadge status={application.status} />
                <p className="text-sm text-navy/60">{application.reference ?? "Draft — no reference yet"}</p>
              </div>
              <h2 className="mt-3 font-serif text-2xl text-navy">
                {electionTypeLabel(application.applicationType)}
              </h2>
              <p className="mt-2 text-sm text-navy/70">{statusExplanation(application.status)}</p>
              <p className="mt-2 text-sm text-navy/70">
                Ballot: {ballotParticipationLabel(application.ballotParticipationStatus)}
              </p>
              <p className="mt-1 text-sm text-navy/60">
                Last updated {formatDateTime(application.updatedAt)}
                {application.submittedAt ? ` · Sent ${formatDateTime(application.submittedAt)}` : ""}
              </p>
              <Link
                href={
                  application.status === "Draft"
                    ? `/candidate/apply/${application.id}`
                    : `/candidate/applications/${application.id}`
                }
                className="mt-4 inline-block text-sm font-semibold text-navy underline-offset-4 hover:underline"
              >
                Open
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
