import { redirect } from "next/navigation";
import { BallotFrame } from "@/components/ballot/BallotFrame";
import { CabinetBallot } from "@/components/ballot/CabinetBallot";
import { readElectorSession } from "@/lib/elector-session";
import { readStore } from "@/lib/store";

export const metadata = { title: "Cabinet ballot" };
export const dynamic = "force-dynamic";

export default async function CabinetBallotPage() {
  const session = await readElectorSession();
  if (!session || session.kind !== "delegate") redirect("/vote");
  const store = await readStore();
  const elector = store.electoralCollege.entries.find((entry) => entry.id === session.electorId);
  if (!elector || elector.electorStatus === "voted") redirect("/vote");
  const draft = store.cabinetDrafts.find((item) => item.electorId === session.electorId);
  const step = Math.min(draft?.step ?? 0, 5);

  return (
    <BallotFrame title="SAKU Cabinet Election" subtitle={session.fullName}>
      <CabinetBallot
        step={step}
        selections={draft?.selections ?? {}}
        candidates={store.cabinetCandidates}
      />
    </BallotFrame>
  );
}
