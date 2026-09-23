"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { requestCabinetOtp, verifyCabinetLogin } from "@/lib/actions/cabinet";

export function CabinetLogin() {
  const router = useRouter();
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [demoOtp, setDemoOtp] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <form
      className="space-y-4 rounded-[28px] bg-white p-6 shadow-sm ring-1 ring-black/5"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        setError(null);
        const result = await verifyCabinetLogin({ registrationNumber, otp });
        setPending(false);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        router.push(result.next ?? "/vote/ballot");
      }}
    >
      <label className="block">
        <span className="text-[11px] tracking-[0.16em] text-navy/40 uppercase">Registration number</span>
        <input
          value={registrationNumber}
          onChange={(event) => setRegistrationNumber(event.target.value)}
          className="mt-2 w-full rounded-2xl bg-[#f3f3f4] px-4 py-3 outline-none focus:ring-2 focus:ring-navy/20"
          autoComplete="username"
        />
      </label>
      <div className="flex gap-2">
        <button
          type="button"
          className="rounded-2xl bg-[#f3f3f4] px-4 py-3 text-sm font-semibold"
          onClick={async () => {
            setError(null);
            const result = await requestCabinetOtp(registrationNumber);
            if (!result.ok) {
              setError(result.error);
              setDemoOtp(null);
              return;
            }
            setDemoOtp(result.demoOtp ?? null);
          }}
        >
          Issue OTP
        </button>
      </div>
      {demoOtp ? (
        <p className="rounded-2xl bg-cream px-4 py-3 text-sm">
          Demonstration OTP: <span className="font-mono font-bold">{demoOtp}</span>
        </p>
      ) : null}
      <label className="block">
        <span className="text-[11px] tracking-[0.16em] text-navy/40 uppercase">One-time password</span>
        <input
          value={otp}
          onChange={(event) => setOtp(event.target.value)}
          inputMode="numeric"
          className="mt-2 w-full rounded-2xl bg-[#f3f3f4] px-4 py-3 outline-none focus:ring-2 focus:ring-navy/20"
        />
      </label>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-2xl bg-navy py-4 text-sm font-bold tracking-[0.18em] text-white uppercase"
      >
        {pending ? "Verifying…" : "Unlock ballot"}
      </button>
    </form>
  );
}
