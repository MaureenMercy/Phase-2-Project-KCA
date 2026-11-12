"use client";

import { useState } from "react";
import { resendCandidateOtp, verifyCandidateOtp } from "@/lib/actions/candidate-portal";

export function OtpForm({ demoOtp }: { demoOtp: string | null }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [shownOtp, setShownOtp] = useState(demoOtp);

  function updateCode(value: string) {
    setCode(value.replace(/\D/g, "").slice(0, 6));
  }

  return (
    <form
      className="space-y-5"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        setError(null);
        const result = await verifyCandidateOtp(code);
        setPending(false);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        window.location.assign(result.next ?? "/candidate/dashboard");
      }}
    >
      <label className="block text-sm font-semibold text-navy">
        6-digit code
        <input
          value={code}
          onChange={(event) => updateCode(event.target.value)}
          onPaste={(event) => {
            event.preventDefault();
            updateCode(event.clipboardData.getData("text"));
          }}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          pattern="[0-9]{6}"
          aria-describedby="otp-help"
          className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-mono text-2xl tracking-[0.4em]"
        />
      </label>
      <p id="otp-help" className="text-sm text-navy/70">
        You can type or paste the code. It expires in five minutes.
      </p>
      {shownOtp ? (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-navy">
          Simulated SMS only. Demo code:{" "}
          <span className="font-mono text-lg tracking-[0.24em]">{shownOtp}</span>
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending || code.length !== 6}
        className="w-full rounded-xl bg-navy py-3.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Checking code…" : "Verify code"}
      </button>
      <button
        type="button"
        className="w-full text-sm text-navy/70 underline-offset-4 hover:underline"
        onClick={async () => {
          const result = await resendCandidateOtp();
          if (result.ok) {
            setShownOtp(result.demoOtp ?? shownOtp);
            setError(null);
          } else setError(result.error);
        }}
      >
        Send a new code
      </button>
    </form>
  );
}
