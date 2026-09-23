import { BallotFrame } from "@/components/ballot/BallotFrame";
import { StudentLogin } from "@/components/ballot/StudentBallot";
import { readStore } from "@/lib/store";

export const metadata = { title: "Election 1 — Delegate Election" };
export const dynamic = "force-dynamic";

export default async function ElectorGatePage() {
  const store = await readStore();
  const open = store.election.stage === "VOTING" && store.election.contest === "ELECTION_1_DELEGATE" && store.election.emergencyStatus === "RUNNING";

  return (
    <BallotFrame
      title="Election 1 — Delegate Election"
      subtitle="Eligible students vote only for candidates in their own electoral unit."
    >
      {open ? (
        <StudentLogin />
      ) : (
        <p className="rounded-[28px] bg-white p-6 text-center text-sm text-navy/70">
          Election 1 voting is not open. The Commission must authorize opening,
          and every unit needs a configured seat allocation.
        </p>
      )}
    </BallotFrame>
  );
}
