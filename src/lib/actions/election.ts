"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  computeElectedDelegates,
  deriveElectoralCollege,
  validateElection1Readiness,
} from "@/lib/electoral";
import { assertPermission } from "@/lib/guard";
import { appendAudit, writeStore } from "@/lib/store";
import type { ActionResult } from "@/lib/actions/auth";
import type { ElectionContest } from "@/lib/types";

export async function saveElectionConfiguration(input: {
  name: string;
  contest: ElectionContest;
  electionDate: string;
  startTime: string;
  endTime: string;
}): Promise<ActionResult> {
  const parsed = z
    .object({
      name: z.string().trim().min(4),
      contest: z.enum(["ELECTION_1_DELEGATE", "SAKU_LEADERSHIP"]),
      electionDate: z.string().min(8),
      startTime: z.string().min(4),
      endTime: z.string().min(4),
    })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: "Check the election configuration fields." };

  const gate = await assertPermission("configure_election");
  if ("error" in gate && gate.error) return { ok: false, error: gate.error };

  const previous = `${gate.store.election.name} / ${gate.store.election.contest}`;
  await writeStore((store) => {
    store.election.name = parsed.data.name;
    store.election.contest = parsed.data.contest;
    store.election.electionDate = parsed.data.electionDate;
    store.election.startTime = parsed.data.startTime;
    store.election.endTime = parsed.data.endTime;
    store.election.updatedAt = new Date().toISOString();
    return store;
  });

  await appendAudit({
    actorWorkId: gate.session.workId,
    actorName: gate.session.fullName,
    action: "configure_election",
    detail: `Updated election configuration to ${parsed.data.name}.`,
    highRisk: false,
    entity: "election",
    entityId: gate.store.election.id,
    oldValue: previous,
    newValue: `${parsed.data.name} / ${parsed.data.contest}`,
  });
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function saveDelegateSeats(input: {
  unitId: string;
  seats: number;
  submit: boolean;
}): Promise<ActionResult> {
  const parsed = z
    .object({
      unitId: z.string().min(1),
      seats: z.number().int().min(1).max(50),
      submit: z.boolean(),
    })
    .safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Enter an explicit delegate-seat number. Do not leave it blank." };
  }

  const gate = await assertPermission("configure_delegate_seats");
  if ("error" in gate && gate.error) return { ok: false, error: gate.error };

  let oldValue: string | null = null;
  await writeStore((store) => {
    store.electoralUnits = store.electoralUnits.map((unit) => {
      if (unit.id !== parsed.data.unitId) return unit;
      oldValue = unit.delegateSeats === null ? "UNCONFIGURED" : String(unit.delegateSeats);
      return {
        ...unit,
        delegateSeats: parsed.data.seats,
        seatStatus: parsed.data.submit ? "SUBMITTED" : "DRAFT",
        updatedAt: new Date().toISOString(),
      };
    });
    return store;
  });

  await appendAudit({
    actorWorkId: gate.session.workId,
    actorName: gate.session.fullName,
    action: "configure_delegate_seats",
    detail: `${parsed.data.submit ? "Submitted" : "Saved draft"} delegate seats (${parsed.data.seats}) for ${parsed.data.unitId}.`,
    highRisk: false,
    entity: "electoral_unit",
    entityId: parsed.data.unitId,
    oldValue,
    newValue: String(parsed.data.seats),
  });
  revalidatePath("/commission/election/election-1");
  return { ok: true };
}

export async function approveDelegateSeats(unitId: string): Promise<ActionResult> {
  const gate = await assertPermission("configure_delegate_seats");
  if ("error" in gate && gate.error) return { ok: false, error: gate.error };

  const unit = gate.store.electoralUnits.find((item) => item.id === unitId);
  if (!unit || unit.delegateSeats === null) {
    return { ok: false, error: "This unit has no explicit seat allocation to approve." };
  }

  await writeStore((store) => {
    store.electoralUnits = store.electoralUnits.map((item) =>
      item.id === unitId
        ? { ...item, seatStatus: "APPROVED", updatedAt: new Date().toISOString() }
        : item,
    );
    return store;
  });
  await appendAudit({
    actorWorkId: gate.session.workId,
    actorName: gate.session.fullName,
    action: "approve_delegate_seats",
    detail: `Approved ${unit.delegateSeats} delegate seats for ${unitId}.`,
    highRisk: false,
    entity: "electoral_unit",
    entityId: unitId,
  });
  revalidatePath("/commission/election/election-1");
  return { ok: true };
}

export async function applyDemonstrationTallies(): Promise<ActionResult> {
  const gate = await assertPermission("configure_election");
  if ("error" in gate && gate.error) return { ok: false, error: gate.error };

  await writeStore((store) => {
    store.delegateCandidates = store.delegateCandidates.map((candidate, index) => ({
      ...candidate,
      votesReceived: 18 - (index % 5) * 3,
    }));
    return store;
  });
  await appendAudit({
    actorWorkId: gate.session.workId,
    actorName: gate.session.fullName,
    action: "demonstration_tallies",
    detail: "Applied prototype Election 1 demonstration tallies. Not a live count.",
    highRisk: false,
    entity: "election",
    entityId: gate.store.election.id,
  });
  revalidatePath("/commission/election/election-1");
  return { ok: true };
}

export async function finalizeElection1Results(): Promise<ActionResult> {
  const gate = await assertPermission("view_results");
  if ("error" in gate && gate.error) return { ok: false, error: gate.error };

  const issues = validateElection1Readiness(gate.store).filter((issue) => issue.code === "seats");
  if (issues.length) {
    return {
      ok: false,
      error: "Cannot finalize Election 1 while any active electoral unit has unconfigured seats.",
    };
  }

  const elected = computeElectedDelegates(gate.store);
  await writeStore((store) => {
    store.electedDelegates = elected;
    return store;
  });
  await appendAudit({
    actorWorkId: gate.session.workId,
    actorName: gate.session.fullName,
    action: "finalize_election_1",
    detail: `Identified ${elected.length} elected delegates from configured seat allocations.`,
    highRisk: false,
  });
  revalidatePath("/commission/election/election-1");
  return { ok: true };
}

export async function generateElectoralCollege(): Promise<ActionResult> {
  const gate = await assertPermission("approve_voter_register");
  if ("error" in gate && gate.error) return { ok: false, error: gate.error };
  if (!gate.store.electedDelegates.length) {
    return { ok: false, error: "Finalize Election 1 results before generating the Electoral College Register." };
  }

  const entries = deriveElectoralCollege(gate.store, gate.store.electedDelegates);
  await writeStore((store) => {
    store.electoralCollege = {
      electionId: store.election.id,
      status: "draft",
      generatedAt: new Date().toISOString(),
      verifiedAt: null,
      verifiedBy: null,
      entries,
    };
    store.electedDelegates = store.electedDelegates.map((item) => ({ ...item, confirmed: true }));
    return store;
  });
  await appendAudit({
    actorWorkId: gate.session.workId,
    actorName: gate.session.fullName,
    action: "generate_electoral_college",
    detail: `Derived ${entries.length} Electoral College electors from confirmed Election 1 results.`,
    highRisk: false,
    entity: "electoral_college",
    entityId: gate.store.election.id,
  });
  revalidatePath("/commission/election/election-1");
  revalidatePath("/commission/election/leadership");
  return { ok: true };
}

export async function verifyElectoralCollege(): Promise<ActionResult> {
  const gate = await assertPermission("approve_voter_register");
  if ("error" in gate && gate.error) return { ok: false, error: gate.error };
  if (gate.store.electoralCollege.status === "not_generated") {
    return { ok: false, error: "Generate the register from Election 1 results first." };
  }

  await writeStore((store) => {
    store.electoralCollege = {
      ...store.electoralCollege,
      status: "active",
      verifiedAt: new Date().toISOString(),
      verifiedBy: gate.session.fullName,
      entries: store.electoralCollege.entries.map((entry) => ({
        ...entry,
        electorStatus: entry.electorStatus === "voted" ? "voted" : "active",
      })),
    };
    store.election.contest = "SAKU_LEADERSHIP";
    store.election.updatedAt = new Date().toISOString();
    return store;
  });
  await appendAudit({
    actorWorkId: gate.session.workId,
    actorName: gate.session.fullName,
    action: "verify_electoral_college",
    detail: "Verified the Electoral College Register. SAKU Leadership Election electorate is now active.",
    highRisk: false,
  });
  revalidatePath("/", "layout");
  return { ok: true };
}
