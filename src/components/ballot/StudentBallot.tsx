"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { castElection1Vote, studentElectorLogin } from "@/lib/actions/elector";
import type { DelegateCandidate } from "@/lib/types";

export function StudentLogin({ preview = false }: { preview?: boolean }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="space-y-4 rounded-[28px] bg-white p-6 shadow-sm ring-1 ring-black/5"
      onSubmit={async (event) => {
        event.preventDefault();
        if (preview) {
          router.push("/preview/voter/ballot");
          return;
        }
        const data = new FormData(event.currentTarget);
        const result = await studentElectorLogin({
          studentId: String(data.get("studentId") ?? ""),
          pin: String(data.get("pin") ?? ""),
        });
        if (!result.ok) {
          setError(result.error);
          return;
        }
        router.push(result.next ?? "/elector/ballot");
      }}
    >
      <p className="rounded-2xl bg-gold/25 px-3 py-2 text-center text-[11px] font-semibold tracking-[0.16em] text-navy uppercase">
        DEMO MODE — MOCK DATA ONLY
      </p>
      <label className="block">
        <span className="text-[11px] tracking-[0.16em] text-navy/40 uppercase">Student ID</span>
        <input name="studentId" placeholder="24/01311" className="mt-2 w-full rounded-2xl bg-[#f3f3f4] px-4 py-3" />
      </label>
      <label className="block">
        <span className="text-[11px] tracking-[0.16em] text-navy/40 uppercase">PIN</span>
        <input name="pin" type="password" defaultValue="SAKU2026" className="mt-2 w-full rounded-2xl bg-[#f3f3f4] px-4 py-3" />
      </label>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <button className="w-full rounded-2xl bg-navy py-4 text-sm font-bold tracking-[0.16em] text-white uppercase" type="submit">
        {preview ? "Preview the ballot" : "Open my ballot"}
      </button>
      <p className="text-xs text-navy/40">
        Your electoral unit is taken from the student record. You cannot change school or department.
      </p>
    </form>
  );
}

export function StudentBallotForm({
  unitLabel,
  campusName,
  schoolName,
  departmentName,
  seats,
  candidates,
  preview = false,
}: {
  unitLabel: string;
  campusName: string;
  schoolName: string | null;
  departmentName: string | null;
  seats: number;
  candidates: DelegateCandidate[];
  preview?: boolean;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"select" | "review">("select");
  const [confirm, setConfirm] = useState(false);
  const choice = candidates.find((item) => item.id === selected) ?? null;

  if (step === "review" && choice) {
    return (
      <div>
        <p className="text-center text-xs tracking-[0.18em] text-navy/35 uppercase">Review your selection</p>
        <h2 className="mt-2 text-center font-serif text-2xl text-navy">{unitLabel}</h2>
        <article className="mt-8 rounded-[28px] bg-white p-6 ring-2 ring-navy">
          <img src={choice.photo} alt="" className="mx-auto h-28 w-28 rounded-full object-cover" />
          <p className="mt-4 text-center text-xl font-semibold text-navy">{choice.fullName}</p>
          <p className="mt-1 text-center text-sm text-navy/55">{campusName}</p>
          <p className="text-center text-sm text-navy/55">
            {[schoolName, departmentName].filter(Boolean).join(" · ")}
          </p>
        </article>
        {error ? <p className="mt-4 text-center text-sm text-red-700">{error}</p> : null}
        <div className="mt-8 flex gap-3">
          <button type="button" className="flex-1 rounded-2xl bg-[#f3f3f4] py-4" onClick={() => setStep("select")}>
            Change selection
          </button>
          <button
            type="button"
            className="flex-1 rounded-2xl bg-navy py-4 text-sm font-bold tracking-[0.12em] text-white uppercase"
            onClick={() => setConfirm(true)}
          >
            Confirm and submit vote
          </button>
        </div>
        {confirm ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-md rounded-[28px] bg-white p-6">
              <p className="font-serif text-2xl">Submit this ballot?</p>
              <p className="mt-2 text-sm text-navy/60">
                Once submitted, your vote cannot be changed. The confirmation screen will not show the candidate you selected.
              </p>
              <div className="mt-5 flex gap-3">
                <button type="button" className="flex-1 rounded-2xl bg-[#f3f3f4] py-3" onClick={() => setConfirm(false)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="flex-1 rounded-2xl bg-navy py-3 font-bold text-white"
                  onClick={async () => {
                    if (preview) {
                      setError("Preview only. No ballot was stored.");
                      setConfirm(false);
                      return;
                    }
                    const result = await castElection1Vote([choice.id]);
                    if (!result.ok) {
                      setError(result.error);
                      setConfirm(false);
                      return;
                    }
                    router.push("/elector/submitted");
                  }}
                >
                  Submit final vote
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div>
      <p className="text-center text-xs tracking-[0.18em] text-navy/35 uppercase">Election 1 — Delegates Election</p>
      <h2 className="mt-2 text-center font-serif text-2xl text-navy">{unitLabel}</h2>
      <p className="mt-3 text-center text-sm text-navy/60">
        Campus: {campusName}
        {schoolName ? ` · School: ${schoolName}` : ""}
        {departmentName ? ` · Department: ${departmentName}` : ""}
      </p>
      <p className="mt-2 text-center text-sm text-navy/70">
        Select ONE candidate to represent your Electoral College. {seats} delegates will be determined at tallying, including the constitutional gender-representation rule. You cannot change your vote after final submission.
      </p>
      <ul className="mt-8 space-y-3">
        {candidates.map((candidate) => {
          const on = selected === candidate.id;
          return (
            <li key={candidate.id}>
              <button
                type="button"
                onClick={() => setSelected(candidate.id)}
                className={[
                  "flex w-full items-center gap-4 rounded-[28px] px-5 py-4 text-left",
                  on ? "bg-navy text-white shadow-lg ring-2 ring-gold" : "bg-white ring-1 ring-black/5",
                ].join(" ")}
              >
                <img src={candidate.photo} alt="" className="h-16 w-16 rounded-full object-cover" />
                <span className="flex-1">
                  <span className="block text-lg font-semibold">{candidate.fullName}</span>
                  <span className={`block text-sm ${on ? "text-gold" : "text-navy/45"}`}>
                    {campusName}
                    {schoolName ? ` · ${schoolName}` : ""}
                  </span>
                </span>
                <span className={`text-sm font-semibold ${on ? "text-gold" : "text-navy/40"}`}>
                  {on ? "✓ Selected" : "Select"}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {error ? <p className="mt-4 text-center text-sm text-red-700">{error}</p> : null}
      <button
        type="button"
        disabled={!selected}
        className="mt-8 w-full rounded-2xl bg-navy py-4 text-sm font-bold tracking-[0.16em] text-white uppercase disabled:opacity-40"
        onClick={() => setStep("review")}
      >
        Review selection
      </button>
    </div>
  );
}
