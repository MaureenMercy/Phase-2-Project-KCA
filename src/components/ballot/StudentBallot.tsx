"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { castElection1Vote, studentElectorLogin } from "@/lib/actions/elector";
import type { DelegateCandidate } from "@/lib/types";

export function StudentLogin() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="space-y-4 rounded-[28px] bg-white p-6 shadow-sm ring-1 ring-black/5"
      onSubmit={async (event) => {
        event.preventDefault();
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
      <label className="block">
        <span className="text-[11px] tracking-[0.16em] text-navy/40 uppercase">Student ID</span>
        <input name="studentId" placeholder="24/01311" className="mt-2 w-full rounded-2xl bg-[#f3f3f4] px-4 py-3" />
      </label>
      <label className="block">
        <span className="text-[11px] tracking-[0.16em] text-navy/40 uppercase">Demonstration PIN</span>
        <input name="pin" type="password" defaultValue="SAKU2026" className="mt-2 w-full rounded-2xl bg-[#f3f3f4] px-4 py-3" />
      </label>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <button className="w-full rounded-2xl bg-navy py-4 text-sm font-bold tracking-[0.16em] text-white uppercase" type="submit">
        Open my ballot
      </button>
      <p className="text-xs text-navy/40">
        Your electoral unit is taken from the student record. You cannot change school or department.
      </p>
    </form>
  );
}

export function StudentBallotForm({
  unitLabel,
  seats,
  candidates,
}: {
  unitLabel: string;
  seats: number;
  candidates: DelegateCandidate[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);

  function toggle(id: string) {
    setSelected((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      if (current.length >= seats) return current;
      return [...current, id];
    });
  }

  return (
    <div>
      <p className="text-center text-xs tracking-[0.18em] text-navy/35 uppercase">Your electoral unit</p>
      <h2 className="mt-2 text-center font-serif text-2xl text-navy">{unitLabel}</h2>
      <p className="mt-1 text-center text-sm text-navy/55">
        Delegate seats: {seats}. Select up to {seats} candidate{seats === 1 ? "" : "s"}.
      </p>
      <ul className="mt-8 space-y-3">
        {candidates.map((candidate) => {
          const on = selected.includes(candidate.id);
          return (
            <li key={candidate.id}>
              <button
                type="button"
                onClick={() => toggle(candidate.id)}
                className={[
                  "flex w-full items-center gap-4 rounded-[28px] px-5 py-4 text-left",
                  on ? "bg-navy text-white shadow-lg" : "bg-white ring-1 ring-black/5",
                ].join(" ")}
              >
                <img src={candidate.photo} alt="" className="h-16 w-16 rounded-full object-cover" />
                <span className="flex-1 text-lg font-semibold">{candidate.fullName}</span>
                <span className={`text-sm ${on ? "text-gold" : "text-navy/40"}`}>{on ? "Selected" : "Select"}</span>
              </button>
            </li>
          );
        })}
      </ul>
      {error ? <p className="mt-4 text-center text-sm text-red-700">{error}</p> : null}
      <button
        type="button"
        className="mt-8 w-full rounded-2xl bg-navy py-4 text-sm font-bold tracking-[0.16em] text-white uppercase"
        onClick={() => setConfirm(true)}
      >
        Review & submit
      </button>
      {confirm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-[28px] bg-white p-6">
            <p className="font-serif text-2xl">Submit this ballot?</p>
            <p className="mt-2 text-sm text-navy/60">Once submitted, it cannot be changed.</p>
            <div className="mt-5 flex gap-3">
              <button type="button" className="flex-1 rounded-2xl bg-[#f3f3f4] py-3" onClick={() => setConfirm(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="flex-1 rounded-2xl bg-navy py-3 font-bold text-white"
                onClick={async () => {
                  const result = await castElection1Vote(selected);
                  if (!result.ok) {
                    setError(result.error);
                    setConfirm(false);
                    return;
                  }
                  router.push("/elector/submitted");
                }}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
