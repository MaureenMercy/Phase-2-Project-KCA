import Link from "next/link";
import { BallotFrame } from "@/components/ballot/BallotFrame";

export const metadata = { title: "Ballot recorded" };

export default function ElectorSubmittedPage() {
  return (
    <BallotFrame title="Vote successfully submitted">
      <div className="rounded-[28px] bg-white p-8 text-center shadow-sm">
        <p className="text-lg">Your vote has been successfully submitted.</p>
        <p className="mt-3 text-sm text-navy/55">
          Your participation in the SAKU Delegates Election has been recorded. This confirmation does not reveal the candidate you selected.
        </p>
        <Link href="/" className="mt-8 inline-block text-sm font-semibold underline">
          Return
        </Link>
      </div>
    </BallotFrame>
  );
}
