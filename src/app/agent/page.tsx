"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthFrame } from "@/components/auth/AuthFrame";
import { agentPortalLogin } from "@/lib/actions/portals";

export default function AgentLoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  return (
    <AuthFrame title="Agent Portal" subtitle="DEMO MODE — MOCK DATA ONLY. Seeded codes AG-001 to AG-003, password KCAU@2026.">
      <form
        className="mt-8 space-y-4 text-left"
        onSubmit={async (event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          const result = await agentPortalLogin({
            agentCode: String(data.get("agentCode") ?? ""),
            password: String(data.get("password") ?? ""),
          });
          if (!result.ok) {
            setError(result.error);
            return;
          }
          router.push(result.next ?? "/agent/home");
        }}
      >
        <input name="agentCode" placeholder="AG-001" className="w-full rounded-xl px-4 py-3 text-navy" />
        <input name="password" type="password" defaultValue="KCAU@2026" className="w-full rounded-xl px-4 py-3 text-navy" />
        {error ? <p className="text-sm text-gold">{error}</p> : null}
        <button className="w-full rounded-xl bg-gold py-3 font-bold tracking-wide text-navy uppercase" type="submit">
          Sign in
        </button>
      </form>
    </AuthFrame>
  );
}
