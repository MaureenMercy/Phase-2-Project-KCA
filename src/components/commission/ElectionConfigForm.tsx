"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveElectionConfiguration } from "@/lib/actions/election";
import type { ElectionContest } from "@/lib/types";

export function ElectionConfigForm({
  name,
  contest,
  electionDate,
  startTime,
  endTime,
  canEdit,
}: {
  name: string;
  contest: ElectionContest;
  electionDate: string;
  startTime: string;
  endTime: string;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  return (
    <form
      className="grid gap-4 md:grid-cols-2"
      onSubmit={async (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        setPending(true);
        const result = await saveElectionConfiguration({
          name: String(data.get("name") ?? ""),
          contest: String(data.get("contest") ?? "") as ElectionContest,
          electionDate: String(data.get("electionDate") ?? ""),
          startTime: String(data.get("startTime") ?? ""),
          endTime: String(data.get("endTime") ?? ""),
        });
        setPending(false);
        if (!result.ok) {
          setMessage(result.error);
          return;
        }
        setMessage("Configuration saved.");
        router.refresh();
      }}
    >
      <label className="block md:col-span-2">
        <span className="text-[11px] tracking-[0.16em] text-navy/40 uppercase">Election name</span>
        <input
          name="name"
          defaultValue={name}
          disabled={!canEdit}
          className="mt-2 w-full rounded-xl border border-navy/15 px-4 py-3"
        />
      </label>
      <label className="block">
        <span className="text-[11px] tracking-[0.16em] text-navy/40 uppercase">Election stage</span>
        <select
          name="contest"
          defaultValue={contest}
          disabled={!canEdit}
          className="mt-2 w-full rounded-xl border border-navy/15 px-4 py-3"
        >
          <option value="ELECTION_1_DELEGATE">Electoral College — Delegate Election</option>
          <option value="SAKU_LEADERSHIP">SAKU Election — Leadership Election</option>
        </select>
      </label>
      <label className="block">
        <span className="text-[11px] tracking-[0.16em] text-navy/40 uppercase">Election date</span>
        <input
          type="date"
          name="electionDate"
          defaultValue={electionDate}
          disabled={!canEdit}
          className="mt-2 w-full rounded-xl border border-navy/15 px-4 py-3"
        />
      </label>
      <label className="block">
        <span className="text-[11px] tracking-[0.16em] text-navy/40 uppercase">Voting start</span>
        <input
          type="time"
          name="startTime"
          defaultValue={startTime}
          disabled={!canEdit}
          className="mt-2 w-full rounded-xl border border-navy/15 px-4 py-3"
        />
      </label>
      <label className="block">
        <span className="text-[11px] tracking-[0.16em] text-navy/40 uppercase">Voting end</span>
        <input
          type="time"
          name="endTime"
          defaultValue={endTime}
          disabled={!canEdit}
          className="mt-2 w-full rounded-xl border border-navy/15 px-4 py-3"
        />
      </label>
      <p className="md:col-span-2 text-sm text-navy/60">
        Voting method: Electronic voting. Station IP and network settings remain ICT functions
        and are not entered here.
      </p>
      {canEdit ? (
        <button
          type="submit"
          disabled={pending}
          className="rounded-sm bg-gold px-4 py-3 text-xs font-bold tracking-[0.16em] text-navy uppercase disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save configuration"}
        </button>
      ) : (
        <p className="text-xs text-navy/50">Your role can review this configuration but cannot change it.</p>
      )}
      {message ? <p className="md:col-span-2 text-sm text-navy/70">{message}</p> : null}
    </form>
  );
}
