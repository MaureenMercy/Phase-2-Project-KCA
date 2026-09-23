import { BallotFrame } from "@/components/ballot/BallotFrame";
import { CabinetLogin } from "@/components/ballot/CabinetLogin";
import { readStore } from "@/lib/store";

export const metadata = { title: "SAKU Cabinet Election" };
export const dynamic = "force-dynamic";

export default async function VoteGatePage() {
  const store = await readStore();
  const locked = store.electoralCollege.status !== "active" || store.election.emergencyStatus === "PAUSED";

  return (
    <BallotFrame
      title="SAKU Cabinet Election"
      subtitle="Delegates vote in the designated room. Registration number + OTP unlocks one sequential ballot."
    >
      {locked ? (
        <p className="rounded-[28px] bg-white p-6 text-center text-sm text-navy/70 shadow-sm">
          {store.election.emergencyStatus === "PAUSED"
            ? "The election is paused by the Electoral Commission."
            : "The SAKU Electoral Register is not active yet. It is generated from finalized Election 1 results."}
        </p>
      ) : (
        <CabinetLogin />
      )}
    </BallotFrame>
  );
}
