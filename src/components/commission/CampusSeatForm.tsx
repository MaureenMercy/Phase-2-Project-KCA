"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveDelegateSeatsForCampus, saveDelegateSeatsForUnconfigured } from "@/lib/actions/election";

export function CampusSeatForm({
  campusId,
  campusName,
}: {
  campusId?: string;
  campusName: string;
}) {
  const router = useRouter();
  const [seats, setSeats] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  return (
    <form
      className="flex flex-wrap items-end gap-2 rounded-2xl border border-dashed border-navy/20 bg-white/80 p-4"
      onSubmit={async (event) => {
        event.preventDefault();
        const value = Number(seats);
        if (!Number.isInteger(value) || value < 1) {
          setMessage("Enter an explicit number. Nothing is assumed.");
          return;
        }
        const result = campusId
          ? await saveDelegateSeatsForCampus({ campusId, seats: value })
          : await saveDelegateSeatsForUnconfigured(value);
        setMessage(result.ok ? `Allocated ${value} seats to unconfigured ${campusName} units.` : result.error);
        if (result.ok) router.refresh();
      }}
    >
      <label className="text-sm">
        Explicit seats for unconfigured {campusName} units
        <input
          value={seats}
          onChange={(event) => setSeats(event.target.value)}
          placeholder="e.g. 2"
          className="mt-1 block w-28 rounded-xl border border-navy/15 px-3 py-2"
        />
      </label>
      <button className="rounded-sm bg-navy px-3 py-2 text-[11px] font-bold tracking-wider text-cream uppercase" type="submit">
        Allocate on {campusName}
      </button>
      {message ? <p className="w-full text-xs text-navy/60">{message}</p> : null}
    </form>
  );
}
