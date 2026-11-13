"use client";

import { useState } from "react";
import { requestIdentitySupport } from "@/lib/actions/voter-portal";

const field = "w-full rounded-xl border border-navy/15 bg-white px-3 py-3 text-sm text-navy";

export function SupportForm({ campuses }: { campuses: { id: string; name: string }[] }) {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <form
      className="space-y-3"
      onSubmit={async (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        setPending(true);
        const result = await requestIdentitySupport({
          studentId: String(data.get("studentId") ?? ""),
          fullName: String(data.get("fullName") ?? ""),
          campusId: String(data.get("campusId") ?? ""),
          reason: String(data.get("reason") ?? ""),
        });
        setPending(false);
        setMessage(
          result.ok
            ? `Your support case was sent. Reference ${result.reference}. An authorized officer will review the institutional register. No duplicate student record was created.`
            : result.error,
        );
        if (result.ok) event.currentTarget.reset();
      }}
    >
      <label className="block text-sm font-semibold text-navy">
        Student ID, if you have one
        <input name="studentId" className={`${field} mt-1`} />
      </label>
      <label className="block text-sm font-semibold text-navy">
        Full name
        <input name="fullName" required className={`${field} mt-1`} />
      </label>
      <label className="block text-sm font-semibold text-navy">
        Campus
        <select name="campusId" className={`${field} mt-1`}>
          {campuses.map((campus) => (
            <option key={campus.id} value={campus.id}>
              {campus.name}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-semibold text-navy">
        What should an authorized officer check?
        <textarea name="reason" required rows={4} className={`${field} mt-1`} />
      </label>
      {message ? <p className="text-sm text-navy/70" role="status">{message}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="min-h-11 rounded-sm bg-navy px-4 py-2 text-xs font-bold tracking-[0.16em] text-cream uppercase disabled:opacity-50"
      >
        {pending ? "Sending…" : "Send support request"}
      </button>
    </form>
  );
}
