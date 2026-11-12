import { notFound } from "next/navigation";
import { ApplicationWizard } from "@/components/candidate/ApplicationWizard";
import { campusDisplayName } from "@/lib/identity";
import { filteredDepartments, filteredSchools } from "@/lib/candidate-portal";
import { requireCandidateSession } from "@/lib/candidate-session";
import { identityByStudentId, publicIdentityView } from "@/lib/identity";
import { normalizeStudentId } from "@/lib/student-auth";
import { readStore } from "@/lib/store";

export const metadata = { title: "Application form" };

export default async function ApplyWizardPage({
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

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-4xl text-navy">Candidate application</h1>
        <p className="mt-2 text-navy/70">
          One step at a time. You can save a draft and come back.
        </p>
      </header>
      <ApplicationWizard
        application={application}
        identity={view}
        config={store.portalConfig}
        campuses={store.campuses
          .filter((item) => item.status === "active")
          .map((item) => ({ id: item.id, name: campusDisplayName(item.id, item.name) }))}
        schools={filteredSchools(store, identity.campusId).map((item) => ({
          id: item.id,
          name: item.name,
        }))}
        departments={filteredDepartments(store, identity.schoolId).map((item) => ({
          id: item.id,
          name: item.name.replace(/^Department of /i, ""),
        }))}
      />
    </div>
  );
}
