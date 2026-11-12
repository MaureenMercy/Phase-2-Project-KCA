"use client";

import { useState } from "react";
import {
  agentCheckIn,
  agentCheckOut,
  requestAcademicCorrection,
  submitAgentIncidentReport,
  submitAgentObservationRecord,
} from "@/lib/actions/agent-portal";
import { Field, fieldClass, primaryButtonClass, secondaryButtonClass } from "@/components/agent/SummaryCard";

export function CheckInButtons({ checkedIn }: { checkedIn: boolean }) {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  async function run(kind: "in" | "out") {
    setPending(true);
    const result = kind === "in" ? await agentCheckIn() : await agentCheckOut();
    setPending(false);
    setMessage(result.ok ? (kind === "in" ? "Checked in at your assigned station." : "Checked out.") : result.error);
  }
  return (
    <div className="flex flex-wrap gap-3">
      <button type="button" className={primaryButtonClass} disabled={pending || checkedIn} onClick={() => void run("in")}>
        Check in
      </button>
      <button type="button" className={secondaryButtonClass} disabled={pending || !checkedIn} onClick={() => void run("out")}>
        Check out
      </button>
      {message ? <p className="w-full text-sm">{message}</p> : null}
    </div>
  );
}

export function CorrectionForm() {
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  return (
    <form
      className="space-y-3"
      onSubmit={async (event) => {
        event.preventDefault();
        const result = await requestAcademicCorrection(note);
        setMessage(result.ok ? "Correction request sent to the Commission. Your verified record is unchanged." : result.error);
      }}
    >
      <Field label="What needs to be corrected?">
        <textarea className={fieldClass} rows={3} value={note} onChange={(event) => setNote(event.target.value)} />
      </Field>
      <button className={secondaryButtonClass} type="submit">Send correction request</button>
      {message ? <p className="text-sm">{message}</p> : null}
    </form>
  );
}

const CATEGORIES = [
  ["process", "Process"],
  ["technical", "Technical"],
  ["security", "Security"],
  ["conduct", "Conduct"],
  ["other", "Other"],
] as const;

export function ObservationForm({ stationId, stationName }: { stationId: string; stationName: string }) {
  const [message, setMessage] = useState<string | null>(null);
  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const file = data.get("evidence");
        const result = await submitAgentObservationRecord({
          category: String(data.get("category") ?? "other") as "process" | "technical" | "security" | "conduct" | "other",
          body: String(data.get("body") ?? ""),
          stationId,
          occurredAt: String(data.get("occurredAt") ?? new Date().toISOString()),
          evidenceName: file instanceof File && file.size ? file.name : undefined,
          evidenceType: file instanceof File && file.size ? file.type : undefined,
        });
        setMessage(result.ok ? "Observation saved. This is your record; it does not classify a Commission incident." : result.error);
        if (result.ok) event.currentTarget.reset();
      }}
    >
      <p className="text-sm text-navy/60">Recording for {stationName}. You cannot change candidate records or ballot configuration from here.</p>
      <Field label="Observation category">
        <select name="category" className={fieldClass} defaultValue="process">
          {CATEGORIES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </Field>
      <Field label="Date and time">
        <input name="occurredAt" type="datetime-local" className={fieldClass} required />
      </Field>
      <Field label="Description">
        <textarea name="body" required rows={4} className={fieldClass} />
      </Field>
      <Field label="Supporting evidence (optional)">
        <input name="evidence" type="file" accept="image/*,video/*,.pdf" className="text-sm" />
      </Field>
      {message ? <p className="text-sm">{message}</p> : null}
      <button className={primaryButtonClass} type="submit">Save observation</button>
    </form>
  );
}

export function IncidentForm({ stationId, stationName }: { stationId: string; stationName: string }) {
  const [message, setMessage] = useState<string | null>(null);
  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const file = data.get("evidence");
        const result = await submitAgentIncidentReport({
          category: String(data.get("category") ?? "other") as "process" | "technical" | "security" | "conduct" | "other",
          description: String(data.get("description") ?? ""),
          stationId,
          occurredAt: String(data.get("occurredAt") ?? new Date().toISOString()),
          evidenceName: file instanceof File && file.size ? file.name : undefined,
          evidenceType: file instanceof File && file.size ? file.type : undefined,
        });
        setMessage(
          result.ok
            ? `Report ${result.reference} was sent to the Electoral Commission. You can track it, but you cannot classify, escalate, resolve or close it.`
            : result.error,
        );
        if (result.ok) event.currentTarget.reset();
      }}
    >
      <p className="text-sm text-navy/60">
        Submit an irregularity at {stationName} to the central Commission incident log. Keep voter identities and ballot choices out of your description.
      </p>
      <Field label="Incident category">
        <select name="category" className={fieldClass} defaultValue="conduct">
          {CATEGORIES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </Field>
      <Field label="Date and time">
        <input name="occurredAt" type="datetime-local" className={fieldClass} required />
      </Field>
      <Field label="Description">
        <textarea name="description" required rows={4} className={fieldClass} />
      </Field>
      <Field label="Photo or video evidence (optional)">
        <input name="evidence" type="file" accept="image/*,video/*,.pdf" className="text-sm" />
      </Field>
      {message ? <p className="text-sm">{message}</p> : null}
      <button className={primaryButtonClass} type="submit">Submit report</button>
    </form>
  );
}
