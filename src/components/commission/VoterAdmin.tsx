"use client";

import { useMemo, useState } from "react";
import { submitVoterException } from "@/lib/actions/voters";

export function ExceptionForm({
  campuses,
  defaultCampusId,
}: {
  campuses: { id: string; name: string }[];
  defaultCampusId: string;
}) {
  const [message, setMessage] = useState<string | null>(null);

  return (
    <form
      className="rounded-2xl border border-navy/10 bg-white/90 p-5 space-y-3"
      onSubmit={async (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const result = await submitVoterException({
          fullName: String(data.get("fullName") ?? ""),
          registrationNumber: String(data.get("registrationNumber") ?? ""),
          campusId: String(data.get("campusId") ?? ""),
          issue: String(data.get("issue") ?? "MISSING_FROM_REGISTER") as
            | "MISSING_FROM_REGISTER"
            | "RECORD_MISMATCH"
            | "DOCUMENTATION"
            | "OTHER",
          reason: String(data.get("reason") ?? ""),
          verificationSource: String(data.get("verificationSource") ?? "Requires Commission decision"),
        });
        setMessage(result.ok ? "Exception case submitted. Eligibility is not granted by this form." : result.error);
        if (result.ok) event.currentTarget.reset();
      }}
    >
      <h2 className="font-serif text-xl text-navy">Submit missing-voter or mismatch case</h2>
      <p className="text-sm text-navy/60">
        A Commissioner cannot independently declare a student eligible because they present themselves at the station.
      </p>
      <div className="grid gap-3 md:grid-cols-2">
        <input name="fullName" required placeholder="Student name" className="rounded-xl border border-navy/15 px-3 py-2 text-sm" />
        <input name="registrationNumber" required placeholder="Registration number" className="rounded-xl border border-navy/15 px-3 py-2 text-sm" />
        <select name="campusId" defaultValue={defaultCampusId} className="rounded-xl border border-navy/15 px-3 py-2 text-sm">
          {campuses.map((campus) => (
            <option key={campus.id} value={campus.id}>
              {campus.name}
            </option>
          ))}
        </select>
        <select name="issue" className="rounded-xl border border-navy/15 px-3 py-2 text-sm">
          <option value="MISSING_FROM_REGISTER">Missing from voter register</option>
          <option value="RECORD_MISMATCH">Student record mismatch</option>
          <option value="DOCUMENTATION">Supporting documentation</option>
          <option value="OTHER">Other</option>
        </select>
      </div>
      <textarea name="reason" required placeholder="Reason" rows={3} className="w-full rounded-xl border border-navy/15 px-3 py-2 text-sm" />
      <input
        name="verificationSource"
        defaultValue="Requires authorised institutional/Commission process. Not a finance assumption."
        className="w-full rounded-xl border border-navy/15 px-3 py-2 text-sm"
      />
      {message ? <p className="text-sm text-navy/70">{message}</p> : null}
      <button className="rounded-xl bg-navy px-4 py-2 text-xs font-bold tracking-wide text-cream uppercase" type="submit">
        Submit case
      </button>
    </form>
  );
}

export function VoterLookup({ campuses }: { campuses: { id: string; name: string }[] }) {
  const [query, setQuery] = useState("");
  void campuses;
  const hint = useMemo(
    () => "Search is performed on the register table. Candidate selections are never displayed.",
    [],
  );

  return (
    <section className="rounded-2xl border border-navy/10 bg-white/90 p-6">
      <h2 className="font-serif text-2xl text-navy">Voter status lookup</h2>
      <p className="mt-1 text-sm text-navy/60">{hint}</p>
      <form className="mt-4 flex gap-2">
        <input
          name="q"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Registration number or name"
          className="flex-1 rounded-xl border border-navy/15 px-3 py-2 text-sm"
        />
        <a
          className="rounded-xl bg-navy px-4 py-2 text-xs font-bold tracking-wide text-cream uppercase"
          href={`/commission/voters?q=${encodeURIComponent(query)}`}
        >
          Search register
        </a>
      </form>
    </section>
  );
}
