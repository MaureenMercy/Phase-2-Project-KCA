import { AuthFrame } from "@/components/auth/AuthFrame";
import { MfaForm } from "@/components/auth/MfaForm";
import { getDemoOtp } from "@/lib/actions/auth";
import { requirePendingMfa } from "@/lib/session";

export const metadata = { title: "One-time password" };
export const dynamic = "force-dynamic";

export default async function MfaPage() {
  await requirePendingMfa();
  const demoOtp = await getDemoOtp();

  return (
    <AuthFrame
      title="Verify this session"
      subtitle="A one-time password is required before the system will evaluate your Electoral Commission authority."
    >
      <MfaForm demoOtp={demoOtp} />
    </AuthFrame>
  );
}
