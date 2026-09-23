"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/lib/actions/auth";
import { assertPermission, assignedStationId } from "@/lib/guard";
import { COMMISSION_MEMBERS } from "@/lib/seed";
import { appendAudit, writeStore } from "@/lib/store";
import type { StationReadiness } from "@/lib/types";

export async function updateStationReadiness(
  stationId: string,
  readiness: StationReadiness,
): Promise<ActionResult> {
  const gate = await assertPermission("station_operations");
  if ("error" in gate && gate.error) return { ok: false, error: gate.error };

  const mine = assignedStationId(gate.session);
  if (mine && mine !== stationId) {
    return { ok: false, error: "You may only administer your assigned polling station." };
  }
  if (!mine && gate.session.role === "COMMISSIONER") {
    return { ok: false, error: "No polling station is assigned to this commissioner." };
  }

  const ready = Object.values(readiness).every(Boolean);
  await writeStore((store) => {
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
  if (gate.store.election.emergencyStatus === "PAUSED") {
    return { ok: false, error: "The election is paused. Station opening is suspended." };
  }
  if (gate.store.election.stage !== "VOTING") {
    return { ok: false, error: "The Commission must authorize election opening before a station can open." };
  }

  const mine = assignedStationId(gate.session);
  if (gate.session.role === "COMMISSIONER" && mine !== stationId) {
    return { ok: false, error: "You may only open your assigned polling station." };
  }

  const station = gate.store.pollingStations.find((item) => item.id === stationId);
  if (!station) return { ok: false, error: "Unknown polling station." };
  if (station.votesCast !== 0) {
    return { ok: false, error: "The vote counter must be at zero before opening." };
  }
  if (!Object.values(station.readiness).every(Boolean)) {
    return { ok: false, error: "Confirm every physical-readiness item before opening." };
  }
  if (!station.networkAuthorized || !station.serverReady) {
    return { ok: false, error: "The authorized KCA election network is not ready." };
  }

  await writeStore((store) => {
    store.pollingStations = store.pollingStations.map((item) =>
      item.id === stationId
        ? {
            ...item,
            status: "OPEN",
            openedAt: new Date().toISOString(),
            openedBy: gate.session.fullName,
          }
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

export async function closePollingStation(stationId: string): Promise<ActionResult> {
  const gate = await assertPermission("station_operations");
  if ("error" in gate && gate.error) return { ok: false, error: gate.error };

  const mine = assignedStationId(gate.session);
  if (gate.session.role === "COMMISSIONER" && mine !== stationId) {
    return { ok: false, error: "You may only close your assigned polling station." };
  }

  await writeStore((store) => {
    store.pollingStations = store.pollingStations.map((item) =>
      item.id === stationId
        ? {
            ...item,
            status: "CLOSED",
            closedAt: new Date().toISOString(),
            closedBy: gate.session.fullName,
          }
        : item,
    );
    return store;
  });
  await appendAudit({
    actorWorkId: gate.session.workId,
    actorName: gate.session.fullName,
    action: "close_polling_station",
    detail: `Closed polling station ${stationId}.`,
    highRisk: true,
    stationId,
    electionStage: gate.store.election.stage,
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
