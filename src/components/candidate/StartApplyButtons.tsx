"use client";

import { useState } from "react";
import {
  createOrResumeApplication,
  startBlankApplication,
} from "@/lib/actions/candidate-portal";
import type { CandidateApplicationType } from "@/lib/types";

export function StartApplyButtons() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);

  async function run(kind: CandidateApplicationType | "blank") {
    setPending(kind);
    setError(null);
    const result =
      kind === "blank"
        ? await startBlankApplication()
        : await createOrResumeApplication(kind);
    setPending(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    window.location.assign(result.next ?? "/candidate/apply");
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={Boolean(pending)}
          onClick={() => void run("blank")}
          className="rounded-xl bg-navy px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {pending === "blank" ? "Opening…" : "Start an application"}
        </button>
        <button
          type="button"
          disabled={Boolean(pending)}
          onClick={() => void run("DELEGATE")}
          className="rounded-xl border border-navy px-5 py-3 text-sm font-semibold text-navy disabled:opacity-60"
        >
          Delegates Election
        </button>
        <button
          type="button"
          disabled={Boolean(pending)}
          onClick={() => void run("SAKU_COUNCIL")}
          className="rounded-xl border border-navy px-5 py-3 text-sm font-semibold text-navy disabled:opacity-60"
        >
          SAKU Council Election
        </button>
      </div>
      {error ? (
        <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {error}
        </p>
      ) : null}
    </div>
  );
}
