import { BallotFrame } from "@/components/ballot/BallotFrame";
import { CabinetLogin } from "@/components/ballot/CabinetLogin";
import { requireAuthorizedSession } from "@/lib/session";

export const metadata = { title: "Elector desk preview" };
export const dynamic = "force-dynamic";

export default async function ElectorPreviewPage() {
  await requireAuthorizedSession();

  return (
    <BallotFrame
      preview
      title="SAKU Cabinet Election"
      subtitle="Delegates vote in the designated room. Registration number + OTP unlocks one sequential ballot."
    >
      <CabinetLogin preview />
    </BallotFrame>
  );
}
