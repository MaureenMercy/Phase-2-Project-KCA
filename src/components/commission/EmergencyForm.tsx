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
  const [scope, setScope] = useState<"STATION" | "ALL">("STATION");
  const [stationId, setStationId] = useState("ps-town");
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
            Freeze scope
            <select
              value={scope}
              onChange={(event) => setScope(event.target.value as "STATION" | "ALL")}
              className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2"
            >
              <option value="STATION">Affected campus/station only</option>
              <option value="ALL">All four campuses</option>
            </select>
          </label>
          {scope === "STATION" ? (
            <label className="block text-sm">
              Affected station
              <select
                value={stationId}
                onChange={(event) => setStationId(event.target.value)}
                className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2"
              >
                <option value="ps-ruaraka">Ruaraka</option>
                <option value="ps-town">Town</option>
                <option value="ps-western">Western</option>
                <option value="ps-kitengela">Kitengela</option>
              </select>
            </label>
          ) : null}
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
            run={() =>
              initiateEmergency({
                kind,
                reason,
                evidenceNote,
                scope,
                stationIds: scope === "STATION" ? [stationId] : undefined,
              })
            }
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
