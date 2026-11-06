"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addLeadershipCandidate } from "@/lib/actions/candidates";
import type { CabinetContestId } from "@/lib/types";

const fieldClass =
  "mt-1 w-full rounded-xl border border-navy/15 bg-white px-3 py-2 text-sm text-navy outline-none focus:border-gold";

export function AddLeadershipCandidateForm({
  contests,
  campuses,
  canAdd,
  disabledReason,
}: {
  contests: { id: CabinetContestId; title: string; kind: "candidate" | "ticket" }[];
  campuses: string[];
  canAdd: boolean;
  disabledReason: string;
}) {
  const router = useRouter();
  const [contestId, setContestId] = useState<CabinetContestId>(contests[0]?.id ?? "special-interests");
  const [formKey, setFormKey] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const needsRunningMate = contests.find((item) => item.id === contestId)?.kind === "ticket";

  return (
    <form
      key={formKey}
      className="rounded-2xl border border-navy/10 bg-white/90 p-5"
      onSubmit={async (event) => {
        event.preventDefault();
        if (!canAdd) return;
        setPending(true);
        setError(null);
        setMessage(null);
        const data = new FormData(event.currentTarget);
        const result = await addLeadershipCandidate({
          fullName: String(data.get("fullName") ?? ""),
          contestId: String(data.get("contestId") ?? contestId),
          ticket: String(data.get("ticket") ?? ""),
          campus: String(data.get("campus") ?? ""),
          runningMateName: String(data.get("runningMateName") ?? ""),
        });
        setPending(false);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        setMessage("Leadership candidate added and placed on the Cabinet ballot.");
        setContestId(contests[0]?.id ?? "special-interests");
        setFormKey((value) => value + 1);
        router.refresh();
      }}
    >
      <h2 className="font-serif text-2xl text-navy">Add a leadership candidate</h2>
      <p className="mt-1 text-sm text-navy/60">
        Use this for Cabinet posts (President ticket, Secretary General, Treasurer, and the
        other secretaries). Approved names appear on the Election 2 ballot.
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="block">
          <span className="text-[10px] tracking-[0.14em] text-navy/40 uppercase">Full name</span>
          <input name="fullName" required disabled={!canAdd} placeholder="Candidate full name" className={fieldClass} />
        </label>
        <label className="block">
          <span className="text-[10px] tracking-[0.14em] text-navy/40 uppercase">Position</span>
          <select
            name="contestId"
            disabled={!canAdd}
            value={contestId}
            onChange={(event) => setContestId(event.target.value as CabinetContestId)}
            className={fieldClass}
          >
            {contests.map((contest) => (
              <option key={contest.id} value={contest.id}>
                {contest.title}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-[10px] tracking-[0.14em] text-navy/40 uppercase">Ticket</span>
          <input name="ticket" required disabled={!canAdd} placeholder="Independent or ticket name" className={fieldClass} />
        </label>
        <label className="block">
          <span className="text-[10px] tracking-[0.14em] text-navy/40 uppercase">Campus</span>
          <select name="campus" required disabled={!canAdd} defaultValue="" className={fieldClass}>
            <option value="" disabled>
              Select campus
            </option>
            {campuses.map((campus) => (
              <option key={campus} value={campus}>
                {campus}
              </option>
            ))}
          </select>
        </label>
        {needsRunningMate ? (
          <label className="block md:col-span-2">
            <span className="text-[10px] tracking-[0.14em] text-navy/40 uppercase">Vice President running mate</span>
            <input
              name="runningMateName"
              required
              disabled={!canAdd}
              placeholder="Running mate full name"
              className={fieldClass}
            />
          </label>
        ) : null}
      </div>
      <button
        type="submit"
        disabled={!canAdd || pending}
        title={!canAdd ? disabledReason : undefined}
        className="mt-4 rounded-sm bg-gold px-4 py-2 text-xs font-bold tracking-[0.16em] text-navy uppercase disabled:cursor-not-allowed disabled:opacity-40"
      >
        {pending ? "Adding…" : "Add leadership candidate"}
      </button>
      {!canAdd ? <p className="mt-2 text-xs text-navy/50">{disabledReason}</p> : null}
      {error ? <p className="mt-2 text-xs text-red-700">{error}</p> : null}
      {message ? <p className="mt-2 text-xs text-emerald-800">{message}</p> : null}
    </form>
  );
}
