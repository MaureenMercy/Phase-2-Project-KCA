"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { assignCommissioner } from "@/lib/actions/stations";

export function AssignForm({
  members,
  stations,
}: {
  members: { id: string; label: string }[];
  stations: { id: string; label: string }[];
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <form
      className="mt-4 flex flex-wrap items-end gap-3"
      onSubmit={async (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const result = await assignCommissioner({
          memberId: String(data.get("memberId") ?? ""),
          stationId: String(data.get("stationId") ?? ""),
        });
        setMessage(result.ok ? "Assignment updated. The commissioner should sign in again to refresh station duties." : result.error);
        if (result.ok) router.refresh();
      }}
    >
      <label className="text-sm">
        Commission member
        <select name="memberId" className="mt-1 block rounded-xl border border-navy/15 px-3 py-2">
          {members.map((member) => (
            <option key={member.id} value={member.id}>{member.label}</option>
          ))}
        </select>
      </label>
      <label className="text-sm">
        Polling station
        <select name="stationId" className="mt-1 block rounded-xl border border-navy/15 px-3 py-2">
          {stations.map((station) => (
            <option key={station.id} value={station.id}>{station.label}</option>
          ))}
        </select>
      </label>
      <button className="rounded-sm bg-gold px-4 py-2 text-xs font-bold tracking-[0.16em] text-navy uppercase" type="submit">
        Assign
      </button>
      {message ? <p className="w-full text-xs text-navy/60">{message}</p> : null}
    </form>
  );
}
