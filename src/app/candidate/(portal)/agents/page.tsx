import { AgentNominationPanel } from "@/components/candidate/AgentNominationPanel";
import {
  applicationsForStudent,
  canNominateAgents,
  electionTypeLabel,
  nominationsForApplication,
} from "@/lib/candidate-portal";
import { requireCandidateSession } from "@/lib/candidate-session";
import { readStore } from "@/lib/store";

export const metadata = { title: "Agent nominations" };

export default async function AgentsPage() {
  const session = await requireCandidateSession();
  const store = await readStore();
  const applications = applicationsForStudent(store, session.studentId);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-4xl text-navy">My agent nominations</h1>
        <p className="mt-2 max-w-2xl text-navy/70">
          An invitation is not accreditation. Agents complete registration in the Agent Portal, and
          the Electoral Commission decides accreditation.
        </p>
      </header>
      {applications.map((application) => (
        <div key={application.id} className="space-y-3">
          <h2 className="font-serif text-2xl text-navy">
            {electionTypeLabel(application.applicationType)} · {application.reference ?? "Draft"}
          </h2>
          <AgentNominationPanel
            applicationId={application.id}
            maxAgents={store.portalConfig.maxAgentsPerCandidate}
            nominations={nominationsForApplication(store, application.id)}
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
      ))}
      {applications.length === 0 ? (
        <p className="candidate-card p-6 text-navy/70">Start an application before inviting agents.</p>
      ) : null}
    </div>
  );
}
