"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  classifyIncident,
  escalateIncident,
  linkIncidents,
  recordIncident,
  uploadIncidentEvidence,
} from "@/lib/actions/incidents";
import type { IncidentRecord } from "@/lib/types";

export function RecordIncidentForm({ canRecord }: { canRecord: boolean }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);

  if (!canRecord) {
    return (
      <p className="text-sm text-navy/60">
        Station assignment determines who records incidents. Central Commission
        members review the consolidated log.
      </p>
    );
  }

  return (
    <form
      className="space-y-3"
      onSubmit={async (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const result = await recordIncident({
          category: String(data.get("category")) as IncidentRecord["category"],
          description: String(data.get("description") ?? ""),
          occurredAt: String(data.get("occurredAt") ?? ""),
        });
        setMessage(result.ok ? "Incident recorded." : result.error);
        if (result.ok) {
          event.currentTarget.reset();
          router.refresh();
        }
      }}
    >
      <label className="block text-sm">
        Category
        <select name="category" className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2">
          <option value="process">Process</option>
          <option value="technical">Technical</option>
          <option value="security">Security</option>
          <option value="conduct">Conduct</option>
          <option value="other">Other</option>
        </select>
      </label>
      <label className="block text-sm">
        When
        <input type="datetime-local" name="occurredAt" className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2" />
      </label>
      <label className="block text-sm">
        Description
        <textarea name="description" rows={4} className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2" />
      </label>
      <button className="rounded-sm bg-navy px-4 py-2 text-xs font-bold tracking-[0.16em] text-cream uppercase" type="submit">
        Record incident
      </button>
      {message ? <p className="text-sm text-navy/70">{message}</p> : null}
    </form>
  );
}

export function EvidenceUpload({ incidentId }: { incidentId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <form
      className="mt-3 flex flex-wrap items-center gap-2"
      onSubmit={async (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const result = await uploadIncidentEvidence(incidentId, data);
        setMessage(result.ok ? "Evidence uploaded." : result.error);
        if (result.ok) {
          event.currentTarget.reset();
          router.refresh();
        }
      }}
    >
      <input name="evidence" type="file" accept="image/*,video/*" className="text-xs" />
      <button className="rounded-sm bg-gold px-3 py-2 text-[11px] font-bold tracking-wider text-navy uppercase" type="submit">
        Upload evidence
      </button>
      {message ? <p className="w-full text-xs text-navy/60">{message}</p> : null}
    </form>
  );
}

export function EscalateButton({ incidentId }: { incidentId: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      className="text-xs font-semibold text-navy underline"
      onClick={async () => {
        await escalateIncident(incidentId, "Referred to Legal / Dispute process. The system does not adjudicate.");
        router.refresh();
      }}
    >
      Officially escalate
    </button>
  );
}

export function ClassifyButtons({ incidentId }: { incidentId: string }) {
  const router = useRouter();
  return (
    <div className="flex flex-wrap gap-3">
      <button
        type="button"
        className="text-xs font-semibold text-navy underline"
        onClick={async () => {
          await classifyIncident({ incidentId, status: "reviewed", note: "Commission classification recorded." });
          router.refresh();
        }}
      >
        Mark reviewed
      </button>
      <button
        type="button"
        className="text-xs font-semibold text-navy underline"
        onClick={async () => {
          await classifyIncident({ incidentId, status: "closed", note: "Closed after Commission review." });
          router.refresh();
        }}
      >
        Resolve / close
      </button>
    </div>
  );
}

export function LinkIncidentForm({
  incidentId,
  options,
}: {
  incidentId: string;
  options: { id: string; label: string }[];
}) {
  const router = useRouter();
  if (!options.length) return null;
  return (
    <form
      className="mt-2 flex flex-wrap items-center gap-2"
      onSubmit={async (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        await linkIncidents({ fromId: incidentId, toId: String(data.get("toId") ?? "") });
        router.refresh();
      }}
    >
      <select name="toId" className="rounded-xl border border-navy/15 px-2 py-1 text-xs">
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
      <button className="text-xs font-semibold text-navy underline" type="submit">
        Link related report
      </button>
    </form>
  );
}
