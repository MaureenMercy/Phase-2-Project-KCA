import { CorrectionForm } from "@/components/candidate/CorrectionForm";
import { VerifiedRecordCard } from "@/components/candidate/VerifiedRecordCard";
import { campusDisplayName } from "@/lib/identity";
import { filteredDepartments, filteredSchools } from "@/lib/candidate-portal";
import { requireCandidateSession } from "@/lib/candidate-session";
import { formatDateTime } from "@/lib/format";
import { identityByStudentId, publicIdentityView } from "@/lib/identity";
import { normalizeStudentId } from "@/lib/student-auth";
import { readStore } from "@/lib/store";

export const metadata = { title: "My profile" };

export default async function ProfilePage() {
  const session = await requireCandidateSession();
  const store = await readStore();
  const identity = identityByStudentId(store, session.studentId)!;
  const view = publicIdentityView(store, identity);
  const requests = store.correctionRequests.filter(
    (item) => normalizeStudentId(item.studentId) === normalizeStudentId(session.studentId),
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-4xl text-navy">My profile</h1>
        <p className="mt-2 max-w-2xl text-navy/70">
          This is the shared ORBIS student identity used across the election portals. National ID
          numbers are masked. You cannot edit verified academic details yourself.
        </p>
      </header>
      <VerifiedRecordCard identity={view}>
        <CorrectionForm
          campusId={identity.campusId}
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
      </VerifiedRecordCard>
      <section className="candidate-card p-6">
        <h2 className="font-serif text-2xl text-navy">Correction requests</h2>
        {requests.length === 0 ? (
          <p className="mt-2 text-sm text-navy/70">No correction requests yet.</p>
        ) : (
          <ul className="mt-3 space-y-3 text-sm">
            {requests.map((item) => (
              <li key={item.id}>
                <p className="font-semibold text-navy">
                  {item.field} · {item.status.replace("_", " ")}
                </p>
                <p className="text-navy/70">{item.reason}</p>
                <p className="text-navy/50">{formatDateTime(item.createdAt)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
