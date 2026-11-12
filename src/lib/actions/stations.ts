"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/lib/actions/auth";
import { contextElection } from "@/lib/elections";
import { assertOwnStation, assertPermission } from "@/lib/guard";
import { COMMISSION_MEMBERS } from "@/lib/seed";
import { appendAudit, writeStore } from "@/lib/store";
import type { StationReadiness } from "@/lib/types";

export async function updateStationReadiness(
  stationId: string,
  readiness: StationReadiness,
): Promise<ActionResult> {
  const gate = await assertPermission("station_operations");
  if ("error" in gate && gate.error) return { ok: false, error: gate.error };

  const stationError = assertOwnStation(gate.session, stationId);
  if (stationError) return { ok: false, error: stationError };

  const ready = Object.values(readiness).every(Boolean);
  await writeStore((store) => {
    const electionId = contextElection(store).id;
    store.pollingStations = store.pollingStations.map((station) =>
      station.id === stationId
        ? {
            ...station,
            readiness,
            status: station.status === "OPEN" || station.status === "CLOSED"
              ? station.status
              : ready
                ? "READY"
                : "NOT_READY",
          }
        : station,
    );
    store.stationElectionState = store.stationElectionState.map((item) =>
      item.stationId === stationId && item.electionId === electionId
        ? {
            ...item,
            readiness,
            status:
              item.status === "OPEN" || item.status === "CLOSED"
                ? item.status
                : ready
                  ? "READY"
                  : "NOT_READY",
          }
        : item,
    );
    return store;
  });
  await appendAudit({
    actorWorkId: gate.session.workId,
    actorName: gate.session.fullName,
    action: "station_readiness",
    detail: `Updated readiness for ${stationId}.`,
    highRisk: false,
    stationId,
    electionStage: gate.store.election.stage,
  });
  revalidatePath("/commission/stations");
  return { ok: true };
}

export async function openPollingStation(stationId: string): Promise<ActionResult> {
  const gate = await assertPermission("station_operations");
  if ("error" in gate && gate.error) return { ok: false, error: gate.error };
  const stationError = assertOwnStation(gate.session, stationId);
  if (stationError) return { ok: false, error: stationError };

  const election = contextElection(gate.store);
  if (election.emergencyStatus === "PAUSED") {
    return { ok: false, error: "The election is paused. Station opening is suspended." };
  }
  if (election.stage !== "VOTING") {
    return { ok: false, error: "The Commission must authorize election opening before a station can open." };
  }

  const station = gate.store.pollingStations.find((item) => item.id === stationId);
  if (!station) return { ok: false, error: "Unknown polling station." };
  if (station.frozen) {
    return { ok: false, error: "This station is frozen and cannot be opened until resumption is authorised." };
  }
  const state = gate.store.stationElectionState.find(
    (item) => item.stationId === stationId && item.electionId === election.id,
  );
  if ((state?.votesCast ?? station.votesCast) !== 0) {
    return { ok: false, error: "The vote counter must be at zero before opening." };
  }
  if (!Object.values(station.readiness).every(Boolean)) {
    return { ok: false, error: "Confirm every physical-readiness item before opening." };
  }
  if (!station.networkAuthorized || !station.serverReady) {
    return { ok: false, error: "The authorized KCA election network is not ready." };
  }

  await writeStore((store) => {
    const openedAt = new Date().toISOString();
    store.pollingStations = store.pollingStations.map((item) =>
      item.id === stationId
        ? { ...item, status: "OPEN", openedAt, openedBy: gate.session.fullName }
        : item,
    );
    store.stationElectionState = store.stationElectionState.map((item) =>
      item.stationId === stationId && item.electionId === election.id
        ? { ...item, status: "OPEN", openedAt, openedBy: gate.session.fullName }
        : item,
    );
    return store;
  });
  await appendAudit({
    actorWorkId: gate.session.workId,
    actorName: gate.session.fullName,
    action: "open_polling_station",
    detail: `Opened ${station.name}. Vote counter confirmed at zero.`,
    highRisk: true,
    stationId,
    electionStage: gate.store.election.stage,
  });
  revalidatePath("/commission/stations");
  revalidatePath("/commission/dashboard");
  return { ok: true };
}

export async function closePollingStation(stationId: string, closingNote = ""): Promise<ActionResult> {
  const gate = await assertPermission("station_operations");
  if ("error" in gate && gate.error) return { ok: false, error: gate.error };
  const stationError = assertOwnStation(gate.session, stationId);
  if (stationError) return { ok: false, error: stationError };

  const election = contextElection(gate.store);
  const station = gate.store.pollingStations.find((item) => item.id === stationId);
  if (!station) return { ok: false, error: "Unknown polling station." };

  await writeStore((store) => {
    const closedAt = new Date().toISOString();
    store.pollingStations = store.pollingStations.map((item) =>
      item.id === stationId
        ? {
            ...item,
            status: "CLOSED",
            closedAt,
            closedBy: gate.session.fullName,
            closingNote: closingNote.trim() || item.closingNote,
          }
        : item,
    );
    store.stationElectionState = store.stationElectionState.map((item) =>
      item.stationId === stationId && item.electionId === election.id
        ? {
            ...item,
            status: "CLOSED",
            closedAt,
            closedBy: gate.session.fullName,
            closingNote: closingNote.trim() || item.closingNote,
          }
        : item,
    );
    return store;
  });
  await appendAudit({
    actorWorkId: gate.session.workId,
    actorName: gate.session.fullName,
    action: "close_polling_station",
    detail: `Closed ${station.name} for ${election.shortName}. Other stations are unchanged.`,
    highRisk: true,
    stationId,
    electionStage: election.stage,
  });
  revalidatePath("/commission/stations");
  return { ok: true };
}

export async function assignCommissioner(input: {
  memberId: string;
  stationId: string;
}): Promise<ActionResult> {
  const parsed = z
    .object({ memberId: z.string(), stationId: z.string() })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: "Select a commissioner and a station." };

  const gate = await assertPermission("assign_polling_stations");
  if ("error" in gate && gate.error) return { ok: false, error: gate.error };

  const member = COMMISSION_MEMBERS.find((item) => item.id === parsed.data.memberId);
  if (!member || member.role !== "COMMISSIONER") {
    return { ok: false, error: "Only operational commissioners are assigned to polling stations." };
  }

  await writeStore((store) => {
    store.assignments = store.assignments.map((item) =>
      item.memberId === parsed.data.memberId && item.active
        ? {
            ...item,
            active: false,
            endedAt: new Date().toISOString(),
            endedBy: gate.session.fullName,
          }
        : item,
    );
    store.assignments.push({
      id: `asg-${crypto.randomUUID()}`,
      memberId: parsed.data.memberId,
      stationId: parsed.data.stationId,
      assignedBy: gate.session.fullName,
      assignedAt: new Date().toISOString(),
      active: true,
      endedAt: null,
      endedBy: null,
    });
    return store;
  });

  member.pollingStationIds = [parsed.data.stationId];

  await appendAudit({
    actorWorkId: gate.session.workId,
    actorName: gate.session.fullName,
    action: "assign_polling_stations",
    detail: `Assigned ${member.id} to ${parsed.data.stationId}.`,
    highRisk: false,
    entity: "assignment",
    entityId: parsed.data.memberId,
    newValue: parsed.data.stationId,
  });
  revalidatePath("/commission/stations");
  return { ok: true };
}
