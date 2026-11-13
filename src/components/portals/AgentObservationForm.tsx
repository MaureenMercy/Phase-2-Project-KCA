"use client";

import { useState } from "react";
import { submitAgentObservation } from "@/lib/actions/portals";

export function AgentObservationForm({ stationId }: { stationId: string }) {
  const [message, setMessage] = useState<string | null>(null);
  return (
    <form
      className="rounded-2xl border border-navy/10 bg-white p-5 space-y-3"
      onSubmit={async (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const file = data.get("evidence");
        const result = await submitAgentObservation({
          body: String(data.get("body") ?? ""),
          stationId,
          evidenceName: file instanceof File && file.size ? file.name : undefined,
          evidenceType: file instanceof File && file.size ? file.type : undefined,
        });
        setMessage(result.ok ? "Observation submitted for Commission review." : result.error);
        if (result.ok) event.currentTarget.reset();
      }}
    >
      <h2 className="font-serif text-2xl text-navy">Submit observation or incident</h2>
      <p className="text-sm text-navy/60">
        This is an Agent-originated report. It is stored in the Commission’s central incident log. You cannot
        classify, escalate or close it.
      </p>
      <textarea name="body" required rows={4} className="w-full rounded-xl border border-navy/15 px-3 py-2 text-sm" />
      <input name="evidence" type="file" accept="image/*,video/*,.pdf" className="text-xs" />
      {message ? <p className="text-sm">{message}</p> : null}
      <button className="rounded-xl bg-navy px-4 py-2 text-xs font-bold tracking-wide text-cream uppercase" type="submit">
        Submit
      </button>
    </form>
  );
}
