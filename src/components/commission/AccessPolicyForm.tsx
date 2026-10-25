"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveAccessPolicy } from "@/lib/actions/ops";
import type { OpsPolicy } from "@/lib/ops-client";

export function AccessPolicyForm({
  policy,
  currentIp,
  workstationId,
  canEdit,
}: {
  policy: OpsPolicy | null;
  currentIp: string;
  workstationId: string;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"open" | "allowlist">(policy?.mode ?? "open");
  const [allowedIpsText, setAllowedIpsText] = useState((policy?.allowedIps ?? []).join("\n"));
  const [applyToCommission, setApplyToCommission] = useState(Boolean(policy?.applyToCommission));
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function addCurrentIp() {
    if (!currentIp) return;
    const existing = allowedIpsText
      .split(/[\n,]+/)
      .map((item) => item.trim())
      .filter(Boolean);
    if (existing.includes(currentIp)) return;
    setAllowedIpsText([...existing, currentIp].join("\n"));
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setMessage(null);
    const result = await saveAccessPolicy({ mode, allowedIpsText, applyToCommission });
    setPending(false);
    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <form onSubmit={(event) => void onSubmit(event)} className="space-y-5">
      <fieldset className="grid gap-3 md:grid-cols-2">
        <label className="rounded-2xl border border-navy/10 bg-cream/50 p-4">
          <input
            type="radio"
            name="mode"
            checked={mode === "open"}
            onChange={() => setMode("open")}
            disabled={!canEdit}
            className="mr-2"
          />
          <span className="font-semibold text-navy">Open access</span>
          <p className="mt-1 text-xs leading-5 text-navy/60">
            Any computer that can reach the site may open a voting desk. Use this
            when workstations are not known in advance.
          </p>
        </label>
        <label className="rounded-2xl border border-navy/10 bg-cream/50 p-4">
          <input
            type="radio"
            name="mode"
            checked={mode === "allowlist"}
            onChange={() => setMode("allowlist")}
            disabled={!canEdit}
            className="mr-2"
          />
          <span className="font-semibold text-navy">Restricted IPs</span>
          <p className="mt-1 text-xs leading-5 text-navy/60">
            Only listed workstation addresses (or CIDR ranges) may vote. Other
            machines are recorded as denied attempts.
          </p>
        </label>
      </fieldset>

      <div>
        <label htmlFor="allowed-ips" className="text-xs font-semibold tracking-wide text-navy uppercase">
          Approved workstation IPs
        </label>
        <textarea
          id="allowed-ips"
          value={allowedIpsText}
          onChange={(event) => setAllowedIpsText(event.target.value)}
          disabled={!canEdit || mode === "open"}
          rows={5}
          placeholder={"127.0.0.1\n10.0.0.0/24"}
          className="mt-2 w-full rounded-xl border border-navy/15 bg-white px-3 py-2 text-sm text-navy disabled:bg-cream/40"
        />
        <p className="mt-2 text-xs text-navy/50">
          This workstation: {currentIp || "IP not visible"} · {workstationId || "no workstation cookie yet"}
        </p>
        <button
          type="button"
          onClick={addCurrentIp}
          disabled={!canEdit || !currentIp}
          className="mt-2 text-xs font-semibold text-navy underline disabled:opacity-40"
        >
          Add this workstation IP
        </button>
      </div>

      <label className="flex items-start gap-2 text-sm text-navy/75">
        <input
          type="checkbox"
          checked={applyToCommission}
          onChange={(event) => setApplyToCommission(event.target.checked)}
          disabled={!canEdit}
          className="mt-1"
        />
        Also apply this list to Commission sign-in, not only to voting desks.
      </label>

      <button
        type="submit"
        disabled={!canEdit || pending}
        className="rounded-sm bg-gold px-4 py-2 text-xs font-bold tracking-[0.16em] text-navy uppercase disabled:opacity-40"
      >
        {pending ? "Saving…" : "Save access policy"}
      </button>
      {message ? <p className="text-xs text-red-700">{message}</p> : null}
    </form>
  );
}
