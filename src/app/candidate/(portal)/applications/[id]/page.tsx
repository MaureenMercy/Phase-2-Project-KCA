import Link from "next/link";
import { notFound } from "next/navigation";
import { AgentNominationPanel } from "@/components/candidate/AgentNominationPanel";
import { StatusBadge } from "@/components/candidate/StatusBadge";
import {
  ballotParticipationLabel,
  canNominateAgents,
  councilPositionById,
  electionTypeLabel,
  nominationsForApplication,
  statusExplanation,
} from "@/lib/candidate-portal";
import { requireCandidateSession } from "@/lib/candidate-session";
import { formatDateTime } from "@/lib/format";
import { identityByStudentId, publicIdentityView } from "@/lib/identity";
import { normalizeStudentId } from "@/lib/student-auth";
import { readStore } from "@/lib/store";

export const metadata = { title: "Application" };

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireCandidateSession();
  const store = await readStore();
  const application = store.candidateApplications.find((item) => item.id === id);
  if (!application || normalizeStudentId(application.studentId) !== normalizeStudentId(session.studentId)) {
    notFound();
  }
  const identity = identityByStudentId(store, session.studentId)!;
  const view = publicIdentityView(store, identity);
  const position = councilPositionById(store.portalConfig, application.councilPositionId);
  const nominations = nominationsForApplication(store, application.id);

  return (
    <div className="space-y-6">
      <StatusBadge status={application.status} />
      <h1 className="font-serif text-4xl text-navy">{electionTypeLabel(application.applicationType)}</h1>
      <p className="text-navy/70">{statusExplanation(application.status)}</p>
      <section className="candidate-card grid gap-4 p-6 sm:grid-cols-2">
        <Detail label="Reference" value={application.reference ?? "Not issued"} />
        <Detail label="Submitted" value={formatDateTime(application.submittedAt)} />
        <Detail label="Student" value={`${view.fullName} · ${view.studentId}`} />
        <Detail label="National ID" value={view.nationalIdMasked} />
        <Detail label="Campus" value={view.campusName} />
        <Detail label="School" value={view.schoolName} />
        <Detail label="Programme / department" value={view.programmeLabel} />
        <Detail
          label={application.applicationType === "SAKU_COUNCIL" ? "Position" : "Electoral College"}
          value={
            application.applicationType === "SAKU_COUNCIL"
              ? position?.title ?? "Not selected"
              : application.electoralCollege?.label ?? "Not configured"
          }
        />
        <Detail
          label="Ballot participation"
          value={ballotParticipationLabel(application.ballotParticipationStatus)}
        />
      </section>
      {application.status === "Draft" ? (
        <Link href={`/candidate/apply/${application.id}`} className="inline-block font-semibold text-navy">
          Continue this draft
        </Link>
      ) : null}
      {application.status === "Awaiting Additional Information" ? (
        <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Outstanding: {application.outstandingRequirements.join(", ") || "additional information requested by the Commission"}.
          You may upload the requested files from{" "}
          <Link href={`/candidate/apply/${application.id}`} className="font-semibold underline">
            the application form
          </Link>
          .
        </p>
      ) : null}
      <AgentNominationPanel
        applicationId={application.id}
        maxAgents={store.portalConfig.maxAgentsPerCandidate}
        nominations={nominations}
        canNominate={canNominateAgents(application)}
        disabledReason={
          application.applicationType !== "SAKU_COUNCIL"
            ? "Election agent invitations are for approved SAKU Council candidacies."
            : application.status !== "Approved"
              ? "You can invite agents after this SAKU Council application is approved."
              : undefined
        }
      />
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold tracking-wide text-navy/50 uppercase">{label}</p>
      <p className="mt-1 text-navy">{value}</p>
    </div>
  );
}
