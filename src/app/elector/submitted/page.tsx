import Link from "next/link";
import { BallotFrame } from "@/components/ballot/BallotFrame";

export const metadata = { title: "Ballot recorded" };

export default function ElectorSubmittedPage() {
  return (
    <BallotFrame title="Vote successfully submitted">
      <div className="rounded-[28px] bg-white p-8 text-center shadow-sm">
        <p className="text-lg">Your Election 1 ballot has been recorded.</p>
        <p className="mt-3 text-sm text-navy/55">You may now leave the voting area.</p>
        <Link href="/" className="mt-8 inline-block text-sm font-semibold underline">
          Return
        </Link>
      </div>
    </BallotFrame>
  );
}
