"use client";

import { useState } from "react";
import { ActionButton } from "@/components/commission/ActionButton";
import { authorizeEmergency, initiateEmergency } from "@/lib/actions/emergency";

export function EmergencyForm({
  canInitiate,
  canAuthorize,
  pendingId,
  isInitiator,
}: {
  canInitiate: boolean;
  canAuthorize: boolean;
  pendingId: string | null;
  isInitiator: boolean;
}) {
  const [kind, setKind] = useState<"PAUSE" | "RESUME">("PAUSE");
  const [reason, setReason] = useState("");
  const [evidenceNote, setEvidenceNote] = useState("");

  return (
    <div className="space-y-5">
      {canInitiate ? (
        <div className="space-y-3">
          <label className="block text-sm">
            Action
            <select
              value={kind}
              onChange={(event) => setKind(event.target.value as "PAUSE" | "RESUME")}
              className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2"
            >
              <option value="PAUSE">Pause election</option>
              <option value="RESUME">Resume election</option>
            </select>
          </label>
          <label className="block text-sm">
            Reason
            <textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={3} className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2" />
          </label>
          <label className="block text-sm">
            Supporting evidence note
            <textarea value={evidenceNote} onChange={(event) => setEvidenceNote(event.target.value)} rows={2} className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2" />
          </label>
          <ActionButton
            label="Initiate emergency action"
            tone="danger"
            disabled={!canInitiate}
            run={() => initiateEmergency({ kind, reason, evidenceNote })}
          />
        </div>
      ) : null}

      {pendingId && canAuthorize ? (
        <ActionButton
          label="Authorize pending action"
          tone="navy"
          disabled={isInitiator}
          disabledReason="Two-person control: the initiator cannot authorize their own action."
          run={() => authorizeEmergency(pendingId)}
        />
      ) : null}
    </div>
  );
}
