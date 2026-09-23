"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { approveDelegateSeats, saveDelegateSeats } from "@/lib/actions/election";

export function SeatConfigForm({
  unitId,
  current,
  canEdit,
  canApprove,
}: {
  unitId: string;
  current: number | null;
  canEdit: boolean;
  canApprove: boolean;
}) {
  const router = useRouter();
  const [seats, setSeats] = useState(current === null ? "" : String(current));
  const [message, setMessage] = useState<string | null>(null);

  async function save(submit: boolean) {
    const value = Number(seats);
    if (!Number.isInteger(value) || value < 1) {
      setMessage("Enter an explicit seat number. Nothing is assumed.");
      return;
    }
    const result = await saveDelegateSeats({ unitId, seats: value, submit });
    setMessage(result.ok ? (submit ? "Submitted for approval." : "Draft saved.") : result.error);
    if (result.ok) router.refresh();
  }

  return (
    <div className="flex flex-wrap items-end gap-2">
      <label className="block">
        <span className="text-[10px] tracking-[0.14em] text-navy/40 uppercase">Delegate seats</span>
        <input
          inputMode="numeric"
          value={seats}
          disabled={!canEdit}
          placeholder="Not configured"
          onChange={(event) => setSeats(event.target.value)}
          className="mt-1 w-28 rounded-xl border border-navy/15 px-3 py-2"
        />
      </label>
      {canEdit ? (
        <>
          <button
            type="button"
            onClick={() => void save(false)}
            className="rounded-sm border border-navy/15 px-3 py-2 text-[11px] font-bold tracking-wider uppercase"
          >
            Save draft
          </button>
          <button
            type="button"
            onClick={() => void save(true)}
            className="rounded-sm bg-navy px-3 py-2 text-[11px] font-bold tracking-wider text-cream uppercase"
          >
            Submit for approval
          </button>
        </>
      ) : null}
      {canApprove ? (
        <button
          type="button"
          onClick={async () => {
            const result = await approveDelegateSeats(unitId);
            setMessage(result.ok ? "Approved." : result.error);
            if (result.ok) router.refresh();
          }}
          className="rounded-sm bg-gold px-3 py-2 text-[11px] font-bold tracking-wider text-navy uppercase"
        >
          Approve
        </button>
      ) : null}
      {message ? <p className="w-full text-xs text-navy/60">{message}</p> : null}
    </div>
  );
}
