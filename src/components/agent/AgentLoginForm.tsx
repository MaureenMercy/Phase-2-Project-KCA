"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { completeAgentLogin, requestAgentLoginOtp } from "@/lib/actions/agent-portal";
import { Field, fieldClass, primaryButtonClass, secondaryButtonClass } from "@/components/agent/SummaryCard";

export function AgentLoginForm({ defaultStudentId = "" }: { defaultStudentId?: string }) {
  const router = useRouter();
  const [studentId, setStudentId] = useState(defaultStudentId);
  const [otp, setOtp] = useState("");
  const [demoOtp, setDemoOtp] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <form
      className="mt-8 space-y-4 text-left"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        setError(null);
        const result = await completeAgentLogin({ studentId, otp });
        setPending(false);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        router.push(result.next ?? "/agent/home");
      }}
    >
      <Field label="Student ID or agent code">
        <input className={fieldClass} value={studentId} onChange={(event) => setStudentId(event.target.value)} placeholder="24/05101 or AG-001" autoComplete="username" />
      </Field>
      <div className="flex flex-wrap items-end gap-3">
        <button
          type="button"
          className={secondaryButtonClass}
          disabled={pending}
          onClick={async () => {
            setPending(true);
            setError(null);
            const result = await requestAgentLoginOtp({ studentId });
            setPending(false);
            if (!result.ok) {
              setError(result.error);
              return;
            }
            setDemoOtp(result.demoOtp ?? null);
          }}
        >
          Send OTP
        </button>
        <p className="text-xs text-navy/50">Simulated SMS only. No live university message is sent.</p>
      </div>
      {demoOtp ? (
        <p className="rounded-xl bg-gold/20 px-4 py-3 text-sm">Simulated OTP (DEMO MODE): <strong>{demoOtp}</strong></p>
      ) : null}
      <Field label="One-time code" hint="Seeded accounts also accept 202026 or KCAU@2026 in DEMO MODE.">
        <input className={fieldClass} value={otp} onChange={(event) => setOtp(event.target.value)} inputMode="numeric" />
      </Field>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <button className={`${primaryButtonClass} w-full`} type="submit" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
