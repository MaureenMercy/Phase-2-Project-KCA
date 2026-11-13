"use client";

import { useState } from "react";
import { assignAgentStation, setMaxAgentsPerCandidate } from "@/lib/actions/agents";

export function AgentPolicyForm({ max }: { max: number }) {
  const [value, setValue] = useState(String(max));
  const [message, setMessage] = useState<string | null>(null);
  return (
    <form
      className="flex flex-wrap items-end gap-3"
      onSubmit={async (event) => {
        event.preventDefault();
        const result = await setMaxAgentsPerCandidate(Number(value));
        setMessage(result.ok ? "Limit saved." : result.error);
      }}
    >
      <label className="text-sm">
        <span className="block text-[10px] tracking-wide text-navy/40 uppercase">Max agents per candidate</span>
        <input
          className="mt-1 w-24 rounded-lg border border-navy/15 px-3 py-2"
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
      </label>
      <button className="rounded-lg bg-navy px-3 py-2 text-xs font-bold tracking-wide text-cream uppercase" type="submit">
        Save
      </button>
      {message ? <p className="text-xs">{message}</p> : null}
    </form>
  );
}

export function AssignStationForm({
  agentId,
  stations,
}: {
  agentId: string;
  stations: { id: string; name: string }[];
}) {
  const [stationId, setStationId] = useState(stations[0]?.id ?? "");
  const [message, setMessage] = useState<string | null>(null);
  return (
    <form
      className="mt-2 flex flex-wrap gap-2"
      onSubmit={async (event) => {
        event.preventDefault();
        const result = await assignAgentStation({ agentId, stationId });
        setMessage(result.ok ? "Assigned." : result.error);
      }}
    >
      <select className="rounded border border-navy/15 px-2 py-1 text-xs" value={stationId} onChange={(event) => setStationId(event.target.value)}>
        {stations.map((station) => (
          <option key={station.id} value={station.id}>{station.name}</option>
        ))}
      </select>
      <button className="text-xs font-bold uppercase" type="submit">Assign</button>
      {message ? <span className="text-xs">{message}</span> : null}
    </form>
  );
}
