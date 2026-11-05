import { BallotFrame } from "@/components/ballot/BallotFrame";
import { CabinetBallot } from "@/components/ballot/CabinetBallot";
import { overlayCandidatePhotos } from "@/lib/ops-overlay";
import { requireAuthorizedSession } from "@/lib/session";
import { readStore } from "@/lib/store";

export const metadata = { title: "Elector ballot preview" };
export const dynamic = "force-dynamic";

export default async function ElectorBallotPreviewPage() {
  await requireAuthorizedSession();
  const store = await readStore();
  const candidates = await overlayCandidatePhotos(store.cabinetCandidates);

  return (
    <BallotFrame preview title="SAKU Cabinet Election" subtitle="Electoral college elector">
      <CabinetBallot preview step={0} selections={{}} candidates={candidates} />
    </BallotFrame>
  );
}
