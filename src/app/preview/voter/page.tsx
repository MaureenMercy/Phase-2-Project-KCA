import { BallotFrame } from "@/components/ballot/BallotFrame";
import { StudentLogin } from "@/components/ballot/StudentBallot";
import { requireAuthorizedSession } from "@/lib/session";

export const metadata = { title: "Voter desk preview" };
export const dynamic = "force-dynamic";

export default async function VoterPreviewPage() {
  await requireAuthorizedSession();

  return (
    <BallotFrame
      preview
      title="Election 1 — Delegate Election"
      subtitle="Eligible students vote only for candidates in their own electoral unit."
    >
      <StudentLogin preview />
    </BallotFrame>
  );
}
