import { redirect } from "next/navigation";
import { BallotFrame } from "@/components/ballot/BallotFrame";
import { StudentBallotForm } from "@/components/ballot/StudentBallot";
import { generateElection1Ballot, unitLabel } from "@/lib/electoral";
import { readElectorSession } from "@/lib/elector-session";
import { readStore } from "@/lib/store";

export const metadata = { title: "Your delegate ballot" };
export const dynamic = "force-dynamic";

export default async function StudentBallotPage() {
  const session = await readElectorSession();
  if (!session || session.kind !== "student") redirect("/elector");
  const store = await readStore();
  const student = store.studentElectors.find((item) => item.studentId === session.electorId);
  if (!student || student.voterStatus === "voted") redirect("/elector");
  const ballot = generateElection1Ballot(store, student);
  if ("error" in ballot || !ballot.seatsConfigured || ballot.seats === null) redirect("/elector");

  return (
    <BallotFrame title="SAKU Election 2026" subtitle="Election 1 — Delegate Election">
      <StudentBallotForm
        unitLabel={unitLabel(ballot.unit)}
        seats={ballot.seats}
        candidates={ballot.candidates}
      />
    </BallotFrame>
  );
}
