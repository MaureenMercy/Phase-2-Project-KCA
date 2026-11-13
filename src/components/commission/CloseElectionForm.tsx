"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { closeElectionWide } from "@/lib/actions/election";
import { ReauthModal } from "@/components/commission/SessionGuard";

export function CloseElectionForm({
  electionName,
  stage,
  votesCast,
  registeredElectors,
  stationsClosed,
  stationsTotal,
  blockingStations,
  canClose,
}: {
  electionName: string;
  stage: string;
  votesCast: number;
  registeredElectors: number;
  stationsClosed: number;
  stationsTotal: number;
  blockingStations: number;
  canClose: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [exception, setException] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [reauthOpen, setReauthOpen] = useState(false);
  const turnout =
    registeredElectors > 0 ? Math.round((votesCast / registeredElectors) * 1000) / 10 : 0;
  const ready = blockingStations === 0;

  async function submit() {
    const result = await closeElectionWide({
      closingNote: note,
      exception: exception && !ready,
    });
    if (result.ok) {
      setOpen(false);
      router.refresh();
      return;
    }
    if (result.needsReauth) {
      setReauthOpen(true);
      return;
    }
    setMessage(result.error);
  }

  return (
    <section className="rounded-2xl border border-navy/10 bg-white/90 p-6">
      <h2 className="font-serif text-2xl text-navy">Election closing</h2>
      <p className="mt-1 text-sm text-navy/60">
        Station closing is performed by the assigned campus Commissioner. Election-wide closing is a
        separate authorised action and does not declare results.
      </p>
      <dl className="mt-4 grid gap-3 text-sm md:grid-cols-4">
        <div>
          <dt className="text-[10px] tracking-[0.16em] text-navy/40 uppercase">Current status</dt>
          <dd>{stage.replaceAll("_", " ")}</dd>
        </div>
        <div>
          <dt className="text-[10px] tracking-[0.16em] text-navy/40 uppercase">Votes cast</dt>
          <dd>{votesCast}</dd>
        </div>
        <div>
          <dt className="text-[10px] tracking-[0.16em] text-navy/40 uppercase">Registered electors</dt>
          <dd>{registeredElectors}</dd>
        </div>
        <div>
          <dt className="text-[10px] tracking-[0.16em] text-navy/40 uppercase">Turnout</dt>
          <dd>{turnout}%</dd>
        </div>
      </dl>
      <p className="mt-3 text-sm text-navy/65">
        Polling stations reporting closed: {stationsClosed} / {stationsTotal || 4}
      </p>
      <ul className="mt-4 space-y-1 text-sm">
        <li>{stage === "VOTING" ? "✓" : "○"} Election is currently OPEN</li>
        <li>{ready ? "✓" : "○"} Polling-station reporting status reviewed</li>
        <li>✓ Closing does not declare or publish results</li>
      </ul>
      {!ready ? (
        <p className="mt-3 text-sm text-red-800">
          Election not ready to close. {blockingStations} polling station
          {blockingStations === 1 ? " has" : "s have"} not reported.
        </p>
      ) : null}
      {canClose ? (
        <button
          type="button"
          className="mt-5 rounded-sm bg-navy px-4 py-2 text-xs font-bold tracking-[0.16em] text-cream uppercase"
          onClick={() => setOpen(true)}
        >
          Close election
        </button>
      ) : (
        <p className="mt-4 text-xs text-navy/50">
          Election-wide close is reserved for authorised Commission leadership. Campus Commissioners
          close only their assigned station.
        </p>
      )}
      {message ? <p className="mt-3 text-sm text-red-700">{message}</p> : null}
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-deep/60 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6">
            <p className="font-serif text-2xl text-navy">Close election?</p>
            <p className="mt-2 text-sm text-navy/70">
              You are about to close {electionName}. This stops new votes, preserves accepted ballots,
              and moves the election to CLOSED / results processing. It does not declare results.
            </p>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Reason / closing note"
              rows={3}
              className="mt-4 w-full rounded-xl border border-navy/15 px-3 py-2 text-sm"
            />
            {!ready ? (
              <label className="mt-3 flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={exception}
                  onChange={(event) => setException(event.target.checked)}
                />
                Request authorised exception because a station has not reported.
              </label>
            ) : null}
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className="px-4 py-2 text-sm" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="rounded-sm bg-navy px-4 py-2 text-sm font-bold text-cream uppercase"
                onClick={() => void submit()}
              >
                Confirm and close election
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <ReauthModal
        open={reauthOpen}
        onClose={() => setReauthOpen(false)}
        onSuccess={() => {
          setReauthOpen(false);
          void submit();
        }}
      />
    </section>
  );
}
