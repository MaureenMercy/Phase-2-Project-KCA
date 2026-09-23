import Link from "next/link";
import { BallotFrame } from "@/components/ballot/BallotFrame";

export const metadata = { title: "Vote submitted" };

export default function SubmittedPage() {
  return (
    <BallotFrame title="Vote successfully submitted">
      <div className="rounded-[28px] bg-white p-8 text-center shadow-sm ring-1 ring-black/5">
        <p className="text-lg text-navy/80">Your vote has been recorded successfully.</p>
        <p className="mt-3 text-sm text-navy/55">You may now leave the voting room.</p>
        <p className="mt-6 text-xs text-navy/35">
          This screen does not show who you voted for.
        </p>
        <Link href="/" className="mt-8 inline-block text-sm font-semibold text-navy underline">
          Return
        </Link>
      </div>
    </BallotFrame>
  );
}
