"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthFrame } from "@/components/auth/AuthFrame";
import { candidatePortalLogin } from "@/lib/actions/portals";

export default function CandidateLoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  return (
    <AuthFrame title="Candidate Portal" subtitle="DEMO MODE — MOCK DATA ONLY. Use a seeded student ID and PIN SAKU2026.">
      <form
        className="mt-8 space-y-4 text-left"
        onSubmit={async (event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          const result = await candidatePortalLogin({
            studentId: String(data.get("studentId") ?? ""),
            pin: String(data.get("pin") ?? ""),
          });
          if (!result.ok) {
            setError(result.error);
            return;
          }
          router.push(result.next ?? "/candidate/home");
        }}
      >
        <input name="studentId" placeholder="24/03102" className="w-full rounded-xl px-4 py-3 text-navy" />
        <input name="pin" type="password" defaultValue="SAKU2026" className="w-full rounded-xl px-4 py-3 text-navy" />
        {error ? <p className="text-sm text-gold">{error}</p> : null}
        <button className="w-full rounded-xl bg-gold py-3 font-bold tracking-wide text-navy uppercase" type="submit">
          Sign in
        </button>
      </form>
    </AuthFrame>
  );
}
