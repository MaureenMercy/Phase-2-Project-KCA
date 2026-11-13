import Link from "next/link";
import { AgentLoginForm } from "@/components/agent/AgentLoginForm";
import { DemoModeBanner } from "@/components/agent/StatusBadge";
import { BrandLogo } from "@/components/brand/BrandLogo";

export const metadata = { title: "Agent sign in" };

export default async function AgentLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ student?: string }>;
}) {
  const { student } = await searchParams;
  return (
    <main className="min-h-screen bg-[#f4f6fa] text-navy">
      <DemoModeBanner />
      <div className="mx-auto flex min-h-[calc(100vh-40px)] max-w-md flex-col justify-center px-4 py-12">
        <div className="rounded-2xl border border-navy/10 bg-white p-8">
          <BrandLogo className="mx-auto h-16 w-auto" />
          <p className="mt-4 text-center text-[11px] tracking-[0.22em] text-navy/40 uppercase">Election Agent Portal</p>
          <h1 className="mt-2 text-center font-serif text-3xl">Sign in</h1>
          <p className="mt-2 text-center text-sm text-navy/60">
            Use the shared student identity. This portal does not create a second student record.
          </p>
          <AgentLoginForm defaultStudentId={student ?? ""} />
          <p className="mt-6 text-center text-sm">
            <Link href="/agent/register" className="underline">Register with an invitation</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
