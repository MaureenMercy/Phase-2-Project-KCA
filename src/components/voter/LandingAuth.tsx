"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { voterPortalLogin } from "@/lib/actions/voter-portal";

const field = "w-full rounded-xl border border-navy/15 bg-white px-4 py-3 text-navy";

export function LandingAuth() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <form
      className="space-y-3"
      onSubmit={async (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        setPending(true);
        setError(null);
        const result = await voterPortalLogin({
          studentId: String(data.get("studentId") ?? ""),
          pin: String(data.get("pin") ?? ""),
        });
        setPending(false);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        router.push(result.next ?? "/voter/home");
      }}
    >
      <label className="block text-left text-sm font-semibold text-navy">
        Student ID
        <input name="studentId" placeholder="24/01211" className={`${field} mt-1`} autoComplete="username" />
      </label>
      <label className="block text-left text-sm font-semibold text-navy">
        PIN
        <input name="pin" type="password" defaultValue="SAKU2026" className={`${field} mt-1`} autoComplete="current-password" />
      </label>
      {error ? <p className="text-sm text-red-800" role="alert">{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="min-h-11 w-full rounded-sm bg-navy py-3 text-xs font-bold tracking-[0.18em] text-cream uppercase disabled:opacity-50"
      >
        {pending ? "Signing in…" : "Sign in to my voter account"}
      </button>
    </form>
  );
}
