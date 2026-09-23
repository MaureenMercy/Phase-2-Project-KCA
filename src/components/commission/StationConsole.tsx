"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { closePollingStation, openPollingStation, updateStationReadiness } from "@/lib/actions/stations";
import type { PollingStation, StationReadiness } from "@/lib/types";

const CHECKS: { key: keyof StationReadiness; label: string }[] = [
  { key: "votingPcs", label: "Voting PCs available" },
  { key: "votingArea", label: "Voting area ready" },
  { key: "materials", label: "Election materials verified" },
  { key: "prepared", label: "Station prepared" },
];

export function StationConsole({
  station,
  canOperate,
}: {
  station: PollingStation;
  canOperate: boolean;
}) {
  const router = useRouter();
  const [readiness, setReadiness] = useState(station.readiness);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function persist(next: StationReadiness) {
    setReadiness(next);
    const result = await updateStationReadiness(station.id, next);
    if (!result.ok) setMessage(result.error);
    router.refresh();
  }

  return (
    <section className="rounded-2xl border border-gold bg-white/95 p-6">
      <p className="text-[10px] tracking-[0.18em] text-gold-dim uppercase">Election opening</p>
      <h2 className="mt-1 font-serif text-3xl text-navy">{station.name}</h2>
      <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
        <div>
          <dt className="text-navy/40">Network status</dt>
          <dd>{station.networkAuthorized ? "● Authorized KCA Network" : "● Unrecognized network"}</dd>
        </div>
        <div>
          <dt className="text-navy/40">Server status</dt>
          <dd>{station.serverReady ? "● READY" : "● NOT READY"}</dd>
        </div>
        <div>
          <dt className="text-navy/40">Votes cast</dt>
          <dd>{station.votesCast}</dd>
        </div>
        <div>
          <dt className="text-navy/40">Station status</dt>
          <dd>{station.status.replaceAll("_", " ")}</dd>
        </div>
      </dl>

      <h3 className="mt-6 text-sm font-semibold text-navy">Physical readiness</h3>
      <ul className="mt-3 space-y-2">
        {CHECKS.map((check) => (
          <li key={check.key}>
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={readiness[check.key]}
                disabled={!canOperate || station.status === "OPEN" || station.status === "CLOSED"}
                onChange={(event) => {
                  void persist({ ...readiness, [check.key]: event.target.checked });
                }}
              />
              {check.label} {readiness[check.key] ? "✓" : ""}
            </label>
          </li>
        ))}
      </ul>

      {canOperate && station.status !== "OPEN" && station.status !== "CLOSED" ? (
        <button
          type="button"
          className="mt-6 rounded-sm bg-gold px-4 py-3 text-xs font-bold tracking-[0.16em] text-navy uppercase"
          onClick={() => setConfirmOpen(true)}
        >
          Open {station.campus} station
        </button>
      ) : null}

      {canOperate && station.status === "OPEN" ? (
        <button
          type="button"
          className="mt-6 rounded-sm bg-navy px-4 py-3 text-xs font-bold tracking-[0.16em] text-cream uppercase"
          onClick={async () => {
            const result = await closePollingStation(station.id);
            setMessage(result.ok ? "Station closed." : result.error);
            router.refresh();
          }}
        >
          Close station
        </button>
      ) : null}

      {message ? <p className="mt-3 text-sm text-navy/70">{message}</p> : null}

      {confirmOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-deep/60 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6">
            <p className="font-serif text-2xl text-navy">Open {station.campus} station?</p>
            <p className="mt-2 text-sm text-navy/70">
              Confirm that the polling station is physically ready and the vote
              counter is at zero before opening.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className="px-4 py-2 text-sm" onClick={() => setConfirmOpen(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="rounded-sm bg-gold px-4 py-2 text-sm font-bold text-navy uppercase"
                onClick={async () => {
                  const result = await openPollingStation(station.id);
                  setConfirmOpen(false);
                  setMessage(result.ok ? "Station status: OPEN" : result.error);
                  router.refresh();
                }}
              >
                Open station
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
