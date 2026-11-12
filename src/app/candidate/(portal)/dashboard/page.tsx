import Link from "next/link";
import { StartApplyButtons } from "@/components/candidate/StartApplyButtons";
import { StatusBadge } from "@/components/candidate/StatusBadge";
import { applicationsForStudent, electionTypeLabel, statusExplanation } from "@/lib/candidate-portal";
import { requireCandidateSession } from "@/lib/candidate-session";
import { formatDateTime } from "@/lib/format";
import { identityByStudentId, publicIdentityView } from "@/lib/identity";
import { normalizeStudentId } from "@/lib/student-auth";
import { readStore } from "@/lib/store";

export const metadata = { title: "Dashboard" };

export default async function CandidateDashboardPage() {
  const session = await requireCandidateSession();
  const store = await readStore();
  const identity = identityByStudentId(store, session.studentId)!;
  const applications = applicationsForStudent(store, session.studentId);
  const notifications = store.portalNotifications
    .filter((item) => normalizeStudentId(item.studentId) === normalizeStudentId(session.studentId))
    .slice(0, 3);
  const view = publicIdentityView(store, identity);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-[11px] font-semibold tracking-[0.2em] text-navy/50 uppercase">
          Home / Dashboard
        </p>
        <h1 className="mt-2 font-serif text-4xl text-navy">Hello, {identity.fullName.split(" ")[0]}</h1>
        <p className="mt-2 max-w-2xl text-navy/70">
          Use this portal to apply, track your application, and invite election agents after approval.
          Submitted is not approved, and approved is not the same as being on a ballot.
        </p>
      </header>
      <section className="candidate-card p-6">
        <p className="text-sm text-navy/60">
          {view.campusName} · {view.schoolName} · {view.programmeLabel}
        </p>
        <div className="mt-4">
          <StartApplyButtons />
        </div>
      </section>
      <section className="grid gap-4 md:grid-cols-2">
        {applications.length === 0 ? (
          <article className="candidate-card p-6">
            <h2 className="font-serif text-2xl text-navy">No applications yet</h2>
            <p className="mt-2 text-sm text-navy/70">Start with the election you want to contest.</p>
          </article>
        ) : (
          applications.map((application) => (
            <article key={application.id} className="candidate-card p-6">
              <StatusBadge status={application.status} />
              <h2 className="mt-3 font-serif text-2xl text-navy">
                {electionTypeLabel(application.applicationType)}
              </h2>
              <p className="mt-2 text-sm text-navy/70">{statusExplanation(application.status)}</p>
              <dl className="mt-4 space-y-1 text-sm">
                <div>Reference: {application.reference ?? "Not issued until you send the form"}</div>
                <div>Updated: {formatDateTime(application.updatedAt)}</div>
                {application.outstandingRequirements.length ? (
                  <div>Still needed: {application.outstandingRequirements.join(", ")}</div>
                ) : null}
              </dl>
              <Link
                href={
                  application.status === "Draft"
                    ? `/candidate/apply/${application.id}`
                    : `/candidate/applications/${application.id}`
                }
                className="mt-4 inline-block text-sm font-semibold text-navy underline-offset-4 hover:underline"
              >
                {application.status === "Draft" ? "Continue application" : "View application"}
              </Link>
            </article>
          ))
        )}
      </section>
      <section className="candidate-card p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-2xl text-navy">Messages</h2>
          <Link href="/candidate/notifications" className="text-sm font-semibold text-navy">
            All notifications
          </Link>
        </div>
        {notifications.length === 0 ? (
          <p className="mt-3 text-sm text-navy/60">No Commission messages yet.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {notifications.map((item) => (
              <li key={item.id}>
                <p className="font-semibold text-navy">{item.title}</p>
                <p className="text-sm text-navy/70">{item.body}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
