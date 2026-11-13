import { StartApplyButtons } from "@/components/candidate/StartApplyButtons";
import { applicationsForStudent, electionTypeLabel } from "@/lib/candidate-portal";
import { requireCandidateSession } from "@/lib/candidate-session";
import { readStore } from "@/lib/store";

export const metadata = { title: "Apply to contest" };

export default async function ApplyIndexPage() {
  const session = await requireCandidateSession();
  const store = await readStore();
  const drafts = applicationsForStudent(store, session.studentId).filter(
    (item) => item.status === "Draft",
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-4xl text-navy">Apply to contest</h1>
        <p className="mt-2 max-w-2xl text-navy/70">
          Complete a short guided application. You will confirm your identity, choose an election,
          review the contest details, upload the required files, then send the form.
        </p>
      </header>
      <StartApplyButtons />
      {drafts.length ? (
        <section className="candidate-card p-6">
          <h2 className="font-serif text-2xl text-navy">Saved drafts</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {drafts.map((item) => (
              <li key={item.id}>
                <a className="font-semibold text-navy underline-offset-4 hover:underline" href={`/candidate/apply/${item.id}`}>
                  Continue {electionTypeLabel(item.applicationType)}
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
