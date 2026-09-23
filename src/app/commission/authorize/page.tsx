import { AuthFrame } from "@/components/auth/AuthFrame";
import { AuthorizeGate } from "@/components/auth/AuthorizeGate";
import { requireAuthorizationGate } from "@/lib/session";

export const metadata = { title: "Verify authority" };
export const dynamic = "force-dynamic";

export default async function AuthorizePage() {
  await requireAuthorizationGate();

  return (
    <AuthFrame
      title="Permission check"
      subtitle="A successful login is not enough. The system now identifies who you are, what role you hold, which election you are assigned to, and what the current stage permits."
    >
      <AuthorizeGate />
    </AuthFrame>
  );
}
