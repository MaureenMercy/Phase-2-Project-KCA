"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  computeElectedDelegates,
  deriveElectoralCollege,
  validateElection1Readiness,
} from "@/lib/electoral";
import { contextElection, liveTotalsHidden, syncLegacyElection } from "@/lib/elections";
import { ELECTION_1_ID, ELECTION_2_ID } from "@/lib/seed-electorate";
import { assertPermission } from "@/lib/guard";
import { appendAudit, writeStore } from "@/lib/store";
import type { ActionResult } from "@/lib/actions/auth";
import type { ElectionContest, ResultsWorkflow } from "@/lib/types";

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

  const target = contextElection(gate.store);
  const previous = `${target.name} / ${target.contest}`;
  await writeStore((store) => {
    const active = contextElection(store);
    store.elections = store.elections.map((item) =>
      item.id === active.id
        ? {
            ...item,
            name: parsed.data.name,
            electionDate: parsed.data.electionDate,
            startTime: parsed.data.startTime,
            endTime: parsed.data.endTime,
            updatedAt: new Date().toISOString(),
          }
        : item,
    );
    syncLegacyElection(store);
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
    store.structuralAudit = [
      {
        id: `sa-${crypto.randomUUID()}`,
        at: new Date().toISOString(),
        actorWorkId: gate.session.workId,
        actorName: gate.session.fullName,
        entity: "electoral_unit",
        entityId: parsed.data.unitId,
        field: "delegateSeats",
        oldValue,
        newValue: String(parsed.data.seats),
        reason: parsed.data.submit ? "Submitted seat allocation" : "Draft seat allocation",
        electionId: ELECTION_1_ID,
        configurationVersionId: store.electoralUnits.find((unit) => unit.id === parsed.data.unitId)
          ?.configurationVersionId ?? null,
      },
      ...store.structuralAudit,
    ];
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

export async function saveDelegateSeatsForUnconfigured(seats: number): Promise<ActionResult> {
  const parsed = z.number().int().min(1).max(50).safeParse(seats);
  if (!parsed.success) {
    return { ok: false, error: "Enter an explicit seat number. Nothing is assumed." };
  }

  const gate = await assertPermission("configure_delegate_seats");
  if ("error" in gate && gate.error) return { ok: false, error: gate.error };

  let updated = 0;
  await writeStore((store) => {
    store.electoralUnits = store.electoralUnits.map((unit) => {
      if (unit.delegateSeats !== null) return unit;
      updated += 1;
      return {
        ...unit,
        delegateSeats: parsed.data,
        seatStatus: "SUBMITTED",
        updatedAt: new Date().toISOString(),
      };
    });
    return store;
  });
  if (!updated) return { ok: false, error: "Every active unit already has an explicit allocation." };

  await appendAudit({
    actorWorkId: gate.session.workId,
    actorName: gate.session.fullName,
    action: "configure_delegate_seats",
    detail: `Explicitly allocated ${parsed.data} delegate seats to ${updated} previously unconfigured units.`,
    highRisk: false,
    entity: "electoral_units",
    newValue: String(parsed.data),
  });
  revalidatePath("/commission/election/election-1");
  return { ok: true };
}

export async function saveDelegateSeatsForCampus(input: {
  campusId: string;
  seats: number;
}): Promise<ActionResult> {
  const parsed = z
    .object({
      campusId: z.string().min(1),
      seats: z.number().int().min(1).max(50),
    })
    .safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Enter an explicit seat number for this campus." };
  }

  const gate = await assertPermission("configure_delegate_seats");
  if ("error" in gate && gate.error) return { ok: false, error: gate.error };

  let updated = 0;
  await writeStore((store) => {
    store.electoralUnits = store.electoralUnits.map((unit) => {
      if (unit.campusId !== parsed.data.campusId || unit.delegateSeats !== null) return unit;
      updated += 1;
      return {
        ...unit,
        delegateSeats: parsed.data.seats,
        seatStatus: "SUBMITTED",
        updatedAt: new Date().toISOString(),
      };
    });
    return store;
  });

  if (!updated) {
    return { ok: false, error: "Every unit on this campus already has an explicit allocation." };
  }

  await appendAudit({
    actorWorkId: gate.session.workId,
    actorName: gate.session.fullName,
    action: "configure_delegate_seats",
    detail: `Explicitly allocated ${parsed.data.seats} delegate seats to ${updated} previously unconfigured units on ${parsed.data.campusId}.`,
    highRisk: false,
    entity: "campus",
    entityId: parsed.data.campusId,
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
  const gate = await assertPermission("configure_election");
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
    store.resultsByElection = store.resultsByElection.map((item) =>
      item.electionId === ELECTION_1_ID
        ? {
            ...item,
            workflow: "GENERATED",
            generatedAt: new Date().toISOString(),
            totals: elected.map((delegate) => ({
              candidateId: delegate.candidateId,
              fullName: delegate.fullName,
              votes: delegate.votesReceived,
              unitId: delegate.unitId,
            })),
          }
        : item,
    );
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

  const results = gate.store.resultsByElection.find((item) => item.electionId === ELECTION_1_ID);
  if (!results || !["VERIFIED", "DECLARATION_AUTHORIZED", "DECLARED", "PUBLISHED"].includes(results.workflow)) {
    return {
      ok: false,
      error: "Verify Election 1 results before generating the Electoral College Register.",
    };
  }
  const confirmed = gate.store.electedDelegates.map((item) => ({ ...item, confirmed: true }));
  const entries = deriveElectoralCollege(gate.store, confirmed);
  await writeStore((store) => {
    if (store.electoralCollege.version > 0) {
      store.electoralCollegeHistory = [
        {
          version: store.electoralCollege.version,
          snapshot: store.electoralCollege,
          createdAt: new Date().toISOString(),
          createdBy: gate.session.fullName,
          reason: "Superseded by a new generated register. Previous version preserved.",
        },
        ...store.electoralCollegeHistory,
      ];
    }
    store.electedDelegates = confirmed;
    store.electoralCollege = {
      electionId: ELECTION_2_ID,
      sourceElectionId: ELECTION_1_ID,
      version: store.electoralCollege.version + 1,
      status: "draft",
      generatedAt: new Date().toISOString(),
      verifiedAt: null,
      verifiedBy: null,
      approvedAt: null,
      approvedBy: null,
      entries,
    };
    store.studentElectors = store.studentElectors.map((student) => {
      const elected = confirmed.some((item) => item.studentId === student.studentId);
      return {
        ...student,
        electedDelegateStatus: elected ? "elected" : "not_elected",
        electoralCollegeEligibility: elected ? "pending" : "not_applicable",
        election2Eligibility: elected ? "pending" : "not_applicable",
      };
    });
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
      approvedAt: new Date().toISOString(),
      approvedBy: gate.session.fullName,
      entries: store.electoralCollege.entries.map((entry) => ({
        ...entry,
        electorStatus: entry.electorStatus === "voted" ? "voted" : "active",
      })),
    };
    const electors = new Set(store.electoralCollege.entries.map((entry) => entry.studentId));
    store.studentElectors = store.studentElectors.map((student) =>
      electors.has(student.studentId)
        ? {
            ...student,
            electoralCollegeEligibility: "eligible",
            election2Eligibility: "eligible",
            election2VotingStatus: student.election2VotingStatus === "voted" ? "voted" : "not_voted",
          }
        : student,
    );
    store.activeElectionContext = "ELECTION_2";
    syncLegacyElection(store);
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

const RESULTS_ORDER: ResultsWorkflow[] = [
  "NOT_STARTED",
  "GENERATED",
  "RECONCILED",
  "VERIFIED",
  "DECLARATION_AUTHORIZED",
  "DECLARED",
  "PUBLISHED",
];

export async function advanceResultsWorkflow(electionId: string): Promise<ActionResult> {
  const currentStore = (await assertPermission("view_results")).store;
  const current = currentStore.resultsByElection.find((item) => item.electionId === electionId);
  const next = current ? RESULTS_ORDER[Math.min(RESULTS_ORDER.indexOf(current.workflow) + 1, RESULTS_ORDER.length - 1)] : "GENERATED";
  const needed =
    next === "DECLARATION_AUTHORIZED" || next === "DECLARED" || next === "PUBLISHED"
      ? "authorize_results"
      : "reconcile_results";
  const gate = await assertPermission(needed);
  if ("error" in gate && gate.error) return { ok: false, error: gate.error };
  const record = gate.store.resultsByElection.find((item) => item.electionId === electionId);
  if (!record) return { ok: false, error: "Results record not found." };
  const election = gate.store.elections.find((item) => item.id === electionId) ?? gate.store.election;
  if (liveTotalsHidden(election) && record.workflow === "NOT_STARTED") {
    return { ok: false, error: "Candidate totals are not available while voting is still active." };
  }
  const following = RESULTS_ORDER[Math.min(RESULTS_ORDER.indexOf(record.workflow) + 1, RESULTS_ORDER.length - 1)];
  await writeStore((store) => {
    store.resultsByElection = store.resultsByElection.map((item) =>
      item.electionId === electionId
        ? {
            ...item,
            workflow: following,
            authorizedBy:
              following === "DECLARATION_AUTHORIZED" ? gate.session.fullName : item.authorizedBy,
            declaredAt: following === "DECLARED" ? new Date().toISOString() : item.declaredAt,
            publishedAt: following === "PUBLISHED" ? new Date().toISOString() : item.publishedAt,
          }
        : item,
    );
    store.elections = store.elections.map((item) =>
      item.id === electionId ? { ...item, resultsWorkflow: following } : item,
    );
    syncLegacyElection(store);
    return store;
  });
  await appendAudit({
    actorWorkId: gate.session.workId,
    actorName: gate.session.fullName,
    action: "results_workflow",
    detail: `${election.shortName} results moved to ${following}. Closing does not declare results.`,
    highRisk: following === "DECLARED" || following === "PUBLISHED",
    entity: "results",
    entityId: electionId,
  });
  revalidatePath("/commission/election");
  return { ok: true };
}

export async function closeElectionWide(input: {
  closingNote: string;
  exception: boolean;
}): Promise<ActionResult> {
  const gate = await assertPermission("authorize_election_closing");
  if ("error" in gate && gate.error) return { ok: false, error: gate.error };
  if ("needsReauth" in gate && gate.needsReauth) {
    return { ok: false, error: "Re-authentication is required.", needsReauth: true };
  }
  const election = contextElection(gate.store);
  if (election.stage !== "VOTING") {
    return { ok: false, error: "This election is not open." };
  }
  const states = gate.store.stationElectionState.filter((item) => item.electionId === election.id);
  const closed = states.filter((item) => item.status === "CLOSED").length;
  const blocking = states.filter((item) => item.status === "OPEN" || item.status === "READY");
  if (blocking.length && !input.exception) {
    return {
      ok: false,
      error: `Election not ready to close. ${blocking.length} polling station${blocking.length === 1 ? " has" : "s have"} not reported as CLOSED.`,
    };
  }

  const voteCount = states.reduce((sum, item) => sum + item.votesCast, 0);
  await writeStore((store) => {
    store.elections = store.elections.map((item) =>
      item.id === election.id
        ? {
            ...item,
            stage: "CLOSED",
            closedAt: new Date().toISOString(),
            closedBy: gate.session.fullName,
            closingNote: input.closingNote.trim(),
            closingExceptionUsed: input.exception,
          }
        : item,
    );
    syncLegacyElection(store);
    return store;
  });
  await appendAudit({
    actorWorkId: gate.session.workId,
    actorName: gate.session.fullName,
    action: "authorize_election_closing",
    detail: `Closed ${election.name}. Votes at closure: ${voteCount}. Stations reporting closed: ${closed}/${states.length || 4}. Results not declared.`,
    highRisk: true,
    entity: "election",
    entityId: election.id,
    reason: input.closingNote.trim() || undefined,
  });
  revalidatePath("/", "layout");
  return { ok: true };
}
