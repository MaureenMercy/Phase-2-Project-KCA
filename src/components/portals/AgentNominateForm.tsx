"use client";

import { useState } from "react";
import { nominateAgent } from "@/lib/actions/portals";

export function AgentNominateForm() {
  const [message, setMessage] = useState<string | null>(null);
  return (
    <form
      className="mt-4 space-y-3"
      onSubmit={async (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const result = await nominateAgent({
          fullName: String(data.get("fullName") ?? ""),
          registrationNumber: String(data.get("registrationNumber") ?? ""),
        });
        setMessage(result.ok ? "Nomination submitted to the Commission." : result.error);
      }}
    >
      <input name="fullName" required placeholder="Agent full name" className="w-full rounded-xl border border-navy/15 px-3 py-2" />
      <input name="registrationNumber" required placeholder="Agent registration number" className="w-full rounded-xl border border-navy/15 px-3 py-2" />
      {message ? <p className="text-sm">{message}</p> : null}
      <button className="rounded-xl bg-navy px-4 py-2 text-xs font-bold tracking-wide text-cream uppercase" type="submit">
        Nominate agent
      </button>
    </form>
  );
}
