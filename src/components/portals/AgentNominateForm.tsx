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
        setMessage(
          result.ok
            ? `Invitation created. Give the student this reference: ${result.next}. They complete the Agent Portal application; accreditation is not automatic.`
            : result.error,
        );
        if (result.ok) event.currentTarget.reset();
      }}
    >
      <p className="text-sm text-navy/60">
        Enter the nominated student’s registration number. Do not publish a candidate list for people to join themselves.
      </p>
      <input name="registrationNumber" required placeholder="Student registration number" className="w-full rounded-xl border border-navy/15 px-3 py-2" />
      <input name="fullName" placeholder="Name (optional note)" className="w-full rounded-xl border border-navy/15 px-3 py-2" />
      {message ? <p className="text-sm">{message}</p> : null}
      <button className="rounded-xl bg-navy px-4 py-2 text-xs font-bold tracking-wide text-cream uppercase" type="submit">
        Issue invitation
      </button>
    </form>
  );
}
