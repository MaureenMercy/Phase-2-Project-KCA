import Link from "next/link";
import { AuthFrame } from "@/components/auth/AuthFrame";
import { logoutAction } from "@/lib/actions/auth";
import { readSession } from "@/lib/session";
import { redirect } from "next/navigation";

export const metadata = { title: "Access denied" };
export const dynamic = "force-dynamic";

export default async function DeniedPage() {
  const session = await readSession();
  if (!session) redirect("/commission/login");
  if (session.state === "authorized") redirect("/commission/dashboard");
  if (session.state !== "denied") redirect("/commission/login");

  return (
    <AuthFrame
      title="Access not granted"
      subtitle="You authenticated, but this portal did not grant Electoral Commission authority."
    >
      <div className="mt-8 rounded-sm border border-gold/20 bg-navy-deep/50 p-5 text-left text-sm leading-6 text-cream/80">
        <p>
          <span className="text-gold">{session.fullName}</span> ({session.workId})
        </p>
        <p className="mt-3">{session.reason}</p>
        <p className="mt-3 text-cream/55">
          ICT, database, deployment, and monitoring work is technical
          administration. It is not an election-operational account and is not
          available here.
        </p>
      </div>
      <form action={logoutAction} className="mt-6">
        <button
          type="submit"
          className="w-full rounded-sm bg-gold py-3 text-sm font-bold tracking-[0.18em] text-navy uppercase"
        >
          Return to login
        </button>
      </form>
      <Link href="/" className="mt-4 inline-block text-xs tracking-[0.16em] text-gold uppercase">
        Back to landing
      </Link>
    </AuthFrame>
  );
}
