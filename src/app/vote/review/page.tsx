import { redirect } from "next/navigation";
import { BallotFrame } from "@/components/ballot/BallotFrame";
import { CabinetReview } from "@/components/ballot/CabinetBallot";
import { isCabinetBallotComplete } from "@/lib/electoral";
import { readElectorSession } from "@/lib/elector-session";
import { readStore } from "@/lib/store";

export const metadata = { title: "Review your vote" };
export const dynamic = "force-dynamic";

export default async function CabinetReviewPage() {
  const session = await readElectorSession();
  if (!session || session.kind !== "delegate") redirect("/vote");
  const store = await readStore();
  const draft = store.cabinetDrafts.find((item) => item.electorId === session.electorId);
  if (!draft || !isCabinetBallotComplete(draft.selections)) redirect("/vote/ballot");

  return (
    <BallotFrame title="SAKU Cabinet Election">
      <CabinetReview selections={draft.selections} candidates={store.cabinetCandidates} />
    </BallotFrame>
  );
}
