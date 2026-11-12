"use client";

import { useState } from "react";
import { nominateAgent, withdrawAgentNomination } from "@/lib/actions/candidate-portal";
import type { AgentNomination } from "@/lib/types";

export function AgentNominationPanel({
  applicationId,
  maxAgents,
  nominations,
  canNominate,
  disabledReason,
}: {
  applicationId: string;
  maxAgents: number;
  nominations: AgentNomination[];
  canNominate: boolean;
  disabledReason?: string;
}) {
  const [studentId, setStudentId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const active = nominations.filter((item) => item.status === "invited");

  return (
    <section className="candidate-card p-6">
      <h2 className="font-serif text-2xl text-navy">Election agent invitations</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-navy/70">
        Invite a student to become your election agent. Sending an invitation does not accredit that
        person. Accreditation is decided by the Electoral Commission. The Commission currently allows{" "}
        {maxAgents} agent{maxAgents === 1 ? "" : "s"} for this candidacy.
      </p>
      {canNominate ? (
        <form
          className="mt-5 flex flex-col gap-3 sm:flex-row"
          onSubmit={async (event) => {
            event.preventDefault();
            setPending(true);
            setError(null);
            setMessage(null);
            const result = await nominateAgent({ applicationId, studentId });
            setPending(false);
            if (!result.ok) {
              setError(result.error);
              return;
            }
            setMessage(`Invitation ${result.reference} sent. The agent is not accredited yet.`);
            setStudentId("");
          }}
        >
          <label className="block flex-1 text-sm">
            <span className="font-semibold text-navy">Proposed agent’s student number</span>
            <input
              value={studentId}
              onChange={(event) => setStudentId(event.target.value)}
              placeholder="24/01212"
              className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-3"
              required
            />
          </label>
          <button
            type="submit"
            disabled={pending}
            className="mt-7 rounded-xl bg-navy px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {pending ? "Sending…" : "Send invitation"}
          </button>
        </form>
      ) : (
        <p className="mt-4 rounded-xl bg-slate-100 px-4 py-3 text-sm text-navy/75">
          {disabledReason ?? "Agent invitations are not available for this application."}
        </p>
      )}
      {error ? (
        <p role="alert" className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {error}
        </p>
      ) : null}
      {message ? (
        <p role="status" className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {message}
        </p>
      ) : null}
      <ul className="mt-6 space-y-3">
        {active.length === 0 ? (
          <li className="text-sm text-navy/60">No agent invitations yet.</li>
        ) : (
          active.map((item) => (
            <li key={item.id} className="rounded-2xl border border-slate-200 p-4">
              <p className="font-semibold text-navy">{item.proposedFullName}</p>
              <p className="text-sm text-navy/70">
                {item.proposedStudentId} · {item.proposedPhoneMasked}
              </p>
              <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-navy/50">Invitation</dt>
                  <dd>{item.invitationReference} · sent</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-navy/50">Agent registration</dt>
                  <dd>{item.agentRegistrationComplete ? "Completed" : "Not yet completed"}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-navy/50">Accreditation</dt>
                  <dd>
                    {item.accreditationStatus === "accredited"
                      ? "Accredited"
                      : item.accreditationStatus === "declined"
                        ? "Declined"
                        : "Not accredited"}
                  </dd>
                </div>
              </dl>
              {item.accreditationStatus !== "accredited" ? (
                <button
                  type="button"
                  className="mt-3 text-sm text-rose-800 underline-offset-4 hover:underline"
                  onClick={() => void withdrawAgentNomination(item.id)}
                >
                  Withdraw invitation
                </button>
              ) : null}
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
