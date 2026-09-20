"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { verifyMfa } from "@/lib/actions/auth";

export function MfaForm({ demoOtp }: { demoOtp: string | null }) {
  const router = useRouter();
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  function updateDigit(index: number, value: string) {
    const next = value.replace(/\D/g, "").slice(-1);
    const copy = [...digits];
    copy[index] = next;
    setDigits(copy);
    if (next && inputs.current[index + 1]) {
      inputs.current[index + 1]?.focus();
    }
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const result = await verifyMfa(digits.join(""));
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push(result.next ?? "/commission/authorize");
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-5">
      <div className="flex justify-center gap-2">
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(node) => {
              inputs.current[index] = node;
            }}
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(event) => updateDigit(index, event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Backspace" && !digits[index] && index > 0) {
                inputs.current[index - 1]?.focus();
              }
            }}
            className="otp-slot h-12 w-10 rounded-sm border border-gold/35 bg-navy-deep/70 text-center font-serif text-2xl text-cream outline-none focus:border-gold"
            aria-label={`Digit ${index + 1}`}
          />
        ))}
      </div>

      {demoOtp ? (
        <div className="rounded-sm border border-gold/25 bg-navy-deep/50 px-4 py-3 text-sm text-cream/80">
          <p className="text-[10px] tracking-[0.18em] text-gold uppercase">
            Institutional OTP channel · demonstration
          </p>
          <p className="mt-1">
            In production this code is delivered by the university SMS or email
            gateway. Demo code:{" "}
            <span className="font-mono text-lg tracking-[0.3em] text-gold">
              {demoOtp}
            </span>
          </p>
        </div>
      ) : (
        <p className="text-sm text-cream/60">
          Enter the 6-digit code sent to your institutional channel. It expires
          in five minutes.
        </p>
      )}

      {error ? (
        <p className="rounded-sm border border-red-300/40 bg-red-950/40 px-3 py-2 text-sm text-red-100">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-sm bg-gold py-3.5 text-sm font-bold tracking-[0.2em] text-navy uppercase hover:bg-gold-light disabled:opacity-60"
      >
        {pending ? "Checking code…" : "Verify one-time password"}
      </button>
    </form>
  );
}
