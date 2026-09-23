import { AuthFrame } from "@/components/auth/AuthFrame";
import { LoginForm } from "@/components/auth/LoginForm";
import { readSession } from "@/lib/session";
import { redirect } from "next/navigation";

export const metadata = { title: "Commission Login" };
export const dynamic = "force-dynamic";

export default async function CommissionLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const session = await readSession();
  if (session?.state === "authorized") redirect("/commission/dashboard");
  if (session?.state === "pending_mfa") redirect("/commission/mfa");
  if (session?.state === "pending_authorization") redirect("/commission/authorize");
  const { reason } = await searchParams;

  return (
    <AuthFrame
      title="Commission Login"
      subtitle="Sign in with your Work ID and institutionally defined password. Electoral authority is determined after authentication."
    >
      {reason === "timeout" ? (
        <p className="mt-4 rounded-sm border border-gold/30 bg-navy-deep/50 px-3 py-2 text-sm text-gold">
          Your session expired due to inactivity. Sign in again.
        </p>
      ) : null}
      <LoginForm />
    </AuthFrame>
  );
}
