import { describe, expect, it } from "vitest";
import { evidenceKind, scopedIncidents } from "@/lib/incidents";
import { createInitialStore } from "@/lib/seed";
import type { SessionPayload } from "@/lib/types";

function session(role: SessionPayload["role"], stationId?: string): SessionPayload {
  return {
    state: "authorized",
    userId: "user",
    workId: "KCAU-EC-004",
    fullName: "Test",
    shortName: "Test",
    role,
    pollingStationIds: stationId ? [stationId] : [],
    lastActivityAt: Date.now(),
  };
}

describe("central incident log", () => {
  const store = createInitialStore();

  it("seeds independent commissioner and agent reports into one log", () => {
    expect(store.incidents.some((item) => item.reporterKind === "commission" && item.stationId === "ps-ruaraka")).toBe(true);
    expect(store.incidents.some((item) => item.reporterKind === "agent" && item.agentId === "agent-003")).toBe(true);
    const agent = store.incidents.find((item) => item.id === "inc-ru-agent")!;
    expect(agent.linkedIncidentId).toBe("inc-ru-booth");
    expect(store.incidents.map((item) => item.stationId).sort()).toEqual(
      expect.arrayContaining(["ps-kitengela", "ps-ruaraka", "ps-town", "ps-western"]),
    );
  });

  it("lets a Town commissioner see only Town-sourced records, including agent reports there", () => {
    const rows = scopedIncidents(store, session("COMMISSIONER", "ps-town"));
    expect(rows.every((item) => item.stationId === "ps-town")).toBe(true);
    expect(rows.some((item) => item.reporterKind === "agent")).toBe(true);
    expect(rows.some((item) => item.stationId === "ps-ruaraka")).toBe(false);
  });

  it("lets the Chair see every campus source", () => {
    const rows = scopedIncidents(store, session("CHAIR"));
    expect(rows.length).toBe(store.incidents.length);
  });

  it("classifies photographs and videos from mime type", () => {
    expect(evidenceKind("image/jpeg", "queue.jpg")).toBe("photograph");
    expect(evidenceKind("video/mp4", "clip.mp4")).toBe("video");
    expect(evidenceKind("application/pdf", "note.pdf")).toBe("document");
  });
});
