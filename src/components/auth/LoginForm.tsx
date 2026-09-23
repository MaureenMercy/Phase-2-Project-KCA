"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginWithWorkId } from "@/lib/actions/auth";
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "@/lib/demo-accounts";

export function LoginForm() {
  const router = useRouter();
  const [workId, setWorkId] = useState("");
  const [password, setPassword] = useState("");
  const [trustDevice, setTrustDevice] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const result = await loginWithWorkId({ workId, password, trustDevice });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push(result.next ?? "/commission/mfa");
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-5">
      <label className="block text-left">
        <span className="text-[11px] font-semibold tracking-[0.18em] text-gold uppercase">
          Work ID
        </span>
        <input
          name="workId"
          autoComplete="username"
          value={workId}
          onChange={(event) => setWorkId(event.target.value)}
          placeholder="KCAU-EC-001"
          className="mt-2 w-full rounded-sm border border-gold/30 bg-navy-deep/60 px-4 py-3 text-cream outline-none placeholder:text-cream/30 focus:border-gold"
        />
      </label>

      <label className="block text-left">
        <span className="text-[11px] font-semibold tracking-[0.18em] text-gold uppercase">
          Institutional password
        </span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-2 w-full rounded-sm border border-gold/30 bg-navy-deep/60 px-4 py-3 text-cream outline-none focus:border-gold"
        />
      </label>

      <label className="flex items-start gap-3 text-left text-sm text-cream/75">
        <input
          type="checkbox"
          checked={trustDevice}
          onChange={(event) => setTrustDevice(event.target.checked)}
          className="mt-1 accent-gold"
        />
        <span>
          Trust this workstation for 30 days. OTP may be skipped on this device
          only.
        </span>
      </label>

      {error ? (
        <p className="rounded-sm border border-red-300/40 bg-red-950/40 px-3 py-2 text-sm text-red-100">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-sm bg-gold py-3.5 text-sm font-bold tracking-[0.2em] text-navy uppercase transition hover:bg-gold-light disabled:opacity-60"
      >
        {pending ? "Verifying credentials…" : "Continue"}
      </button>

      <p className="text-xs leading-5 text-cream/50">
        Authentication is not authorization. A successful login does not grant
        every Electoral Commission power. Biometric sign-in is available only
        where the institution has enrolled this workstation.
      </p>

      <button
        type="button"
        onClick={() => setShowDemo((value) => !value)}
        className="text-xs tracking-[0.16em] text-gold uppercase underline-offset-4 hover:underline"
      >
        {showDemo ? "Hide demonstration accounts" : "Demonstration accounts"}
      </button>

      {showDemo ? (
        <div className="rounded-sm border border-gold/20 bg-navy-deep/40 p-4 text-left text-xs text-cream/80">
          <p className="mb-3 text-cream/60">
            Password for all demo accounts:{" "}
            <span className="font-mono text-gold">{DEMO_PASSWORD}</span>
          </p>
          <ul className="space-y-2">
            {DEMO_ACCOUNTS.map((account) => (
              <li key={account.workId} className="flex justify-between gap-3">
                <button
                  type="button"
                  className="text-left hover:text-gold"
                  onClick={() => {
                    setWorkId(account.workId);
                    setPassword(DEMO_PASSWORD);
                  }}
                >
                  <span className="font-mono text-gold">{account.workId}</span>
                  <span className="block text-cream/70">
                    {account.fullName} · {account.title}
                  </span>
                </button>
                {account.accountKind === "technical" ? (
                  <span className="shrink-0 self-center text-[10px] tracking-wider text-red-200 uppercase">
                    Should be denied
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </form>
  );
}
