import type { AppStore, IncidentEvidence, IncidentRecord, SessionPayload } from "@/lib/types";

export function evidenceKind(mimeType: string, filename = ""): IncidentEvidence["kind"] {
  const value = `${mimeType} ${filename}`.toLowerCase();
  if (value.includes("video") || /\.(mp4|mov|webm)$/i.test(filename)) return "video";
  if (value.includes("image") || /\.(png|jpe?g|gif|webp)$/i.test(filename)) return "photograph";
  return "document";
}

export function scopedIncidents(store: AppStore, session: SessionPayload): IncidentRecord[] {
  if (session.role === "COMMISSIONER") {
    const mine = session.pollingStationIds?.[0];
    return store.incidents.filter((item) => item.stationId === mine);
  }
  return store.incidents;
}

export function incidentCluster(store: AppStore, incident: IncidentRecord): IncidentRecord[] {
  const root = incident.linkedIncidentId ?? incident.id;
  return store.incidents.filter((item) => item.id === root || item.linkedIncidentId === root || item.id === incident.id);
}

export const INCIDENT_SOURCES = [
  { id: "ps-kitengela", label: "Kitengela Commissioner", kind: "commission" as const },
  { id: "ps-ruaraka", label: "Ruaraka Commissioner", kind: "commission" as const },
  { id: "ps-town", label: "Town Commissioner", kind: "commission" as const },
  { id: "ps-western", label: "Western Commissioner", kind: "commission" as const },
  { id: "agents", label: "Accredited Election Agents", kind: "agent" as const },
];
