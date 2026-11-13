import { BallotFrame } from "@/components/ballot/BallotFrame";
import { StudentBallotForm } from "@/components/ballot/StudentBallot";
import { generateElection1Ballot, unitLabel } from "@/lib/electoral";
import { overlayCandidatePhotos } from "@/lib/ops-overlay";
import { requireAuthorizedSession } from "@/lib/session";
import { readStore } from "@/lib/store";

export const metadata = { title: "Voter ballot preview" };
export const dynamic = "force-dynamic";

export default async function VoterBallotPreviewPage() {
  await requireAuthorizedSession();
  const store = await readStore();
  const student =
    store.studentElectors.find((item) => {
      if (item.eligibilityStatus !== "eligible") return false;
      const sample = generateElection1Ballot(store, item);
      return !("error" in sample) && sample.candidates.length > 0;
    }) ??
    store.studentElectors.find((item) => item.eligibilityStatus === "eligible") ??
    store.studentElectors[0];
  const ballot = student ? generateElection1Ballot(store, student) : { error: "No student electors are stored." };

  if (!student || "error" in ballot) {
    return (
      <BallotFrame preview title="Election 1 — Delegate Election" subtitle="Voter ballot preview">
        <p className="rounded-[28px] bg-white p-6 text-center text-sm text-navy/70">
          {"error" in ballot ? ballot.error : "No student is available for a preview ballot."}
        </p>
      </BallotFrame>
    );
  }

  const seats = ballot.seats && ballot.seats > 0 ? ballot.seats : 3;
  const candidates = await overlayCandidatePhotos(ballot.candidates);

  return (
    <BallotFrame preview title="SAKU Election 2026" subtitle="Election 1 — Delegate Election">
      <StudentBallotForm
        preview
        unitLabel={unitLabel(ballot.unit)}
        campusName={ballot.unit.campusName}
        schoolName={ballot.unit.schoolName}
        departmentName={ballot.unit.departmentName}
        seats={seats}
        candidates={candidates}
      />
    </BallotFrame>
  );
}
