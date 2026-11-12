"use server";

import { revalidatePath } from "next/cache";
import { generateElection1Ballot, unitForStudent } from "@/lib/electoral";
import { election1 } from "@/lib/elections";
import { ELECTION_1_ID } from "@/lib/seed-electorate";
import { election1VotingBlock, incrementStationVotes, newReceiptReference } from "@/lib/voting-gate";
import { clearElectorSession, saveElectorSession } from "@/lib/elector-session";
import { appendAudit, readStore, writeStore } from "@/lib/store";
import type { ActionResult } from "@/lib/actions/auth";
import { opsFindEnrolled, opsRecordVote } from "@/lib/ops-client";
import { assertVotingAccess } from "@/lib/ops-guard";
import { overlayPersistedVotes } from "@/lib/ops-overlay";
import { readRequestMeta } from "@/lib/request-meta";
import { normalizeStudentId, pinMatchesStudent } from "@/lib/student-auth";

export async function studentElectorLogin(input: {
  studentId: string;
  pin: string;
}): Promise<ActionResult> {
  const access = await assertVotingAccess({
    actor: input.studentId,
    path: "/elector",
    action: "elector_login",
  });
  if (!access.ok) return { ok: false, error: access.error };

  const store = await overlayPersistedVotes(await readStore());
  const studentPreview = store.studentElectors.find(
    (item) => normalizeStudentId(item.studentId) === normalizeStudentId(input.studentId),
  );
  const block = election1VotingBlock(store, studentPreview?.campusId ?? "");
  if (block && studentPreview) return { ok: false, error: block };
  if (election1(store).stage !== "VOTING") {
    return { ok: false, error: "Election 1 voting is not open." };
  }

  const student = store.studentElectors.find(
    (item) => normalizeStudentId(item.studentId) === normalizeStudentId(input.studentId),
  );
  const enrolled = await opsFindEnrolled(input.studentId);
  const pinOk = await pinMatchesStudent({
    pin: input.pin,
    enrolledPasswordHash: enrolled?.passwordHash ?? null,
  });
  if (!student || !pinOk) {
    return { ok: false, error: "Student ID or PIN is incorrect." };
  }
  if (student.eligibilityStatus !== "eligible") {
    return { ok: false, error: "This student is not eligible for Election 1." };
  }
  if (student.voterStatus === "voted" || student.election1VotingStatus === "voted") {
    return { ok: false, error: "This student has already voted. A second ballot cannot be issued." };
  }
  const unit = unitForStudent(store, student);
  if (!unit) {
    return { ok: false, error: "No electoral unit is mapped for this student." };
  }
  const ballot = generateElection1Ballot(store, student);
  if ("error" in ballot) return { ok: false, error: ballot.error };
  if (!ballot.seatsConfigured) {
    return {
      ok: false,
      error: "Delegate seat allocation has not been configured for this electoral unit.",
    };
  }

  await saveElectorSession({
    kind: "student",
    electorId: student.studentId,
    registrationNumber: student.studentId,
    fullName: student.fullName,
    electionId: ELECTION_1_ID,
    lastActivityAt: Date.now(),
  });
  return { ok: true, next: "/elector/ballot" };
}

export async function castElection1Vote(candidateIds: string[]): Promise<ActionResult> {
  const { readElectorSession } = await import("@/lib/elector-session");
  const session = await readElectorSession();
  if (!session || session.kind !== "student") {
    return { ok: false, error: "Your elector session expired." };
  }

  const store = await overlayPersistedVotes(await readStore());
  const student = store.studentElectors.find((item) => item.studentId === session.electorId);
  if (!student) return { ok: false, error: "Elector record not found." };
  if (student.voterStatus === "voted" || student.election1VotingStatus === "voted") {
    return { ok: false, error: "This student has already voted." };
  }

  const stationBlock = election1VotingBlock(store, student.campusId);
  if (stationBlock) return { ok: false, error: stationBlock };

  const ballot = generateElection1Ballot(store, student);
  if ("error" in ballot) return { ok: false, error: ballot.error };
  if (!ballot.seatsConfigured || ballot.seats === null) {
    return { ok: false, error: "This electoral contest cannot open without a configured seat allocation." };
  }
  if (candidateIds.length !== 1) {
    return { ok: false, error: "Select exactly one candidate. The three delegate seats are determined at tallying, including the gender-representation rule." };
  }
  const allowed = new Set(ballot.candidates.map((item) => item.id));
  if (candidateIds.some((id) => !allowed.has(id))) {
    return { ok: false, error: "You may only vote for candidates in your electoral unit." };
  }

  const access = await assertVotingAccess({
    actor: student.studentId,
    path: "/elector/ballot",
    action: "election1_vote",
  });
  if (!access.ok) return { ok: false, error: access.error };

  const receipt = newReceiptReference();
  await writeStore((current) => {
    current.delegateVotes.push({
      id: `dv-${crypto.randomUUID()}`,
      electionId: ELECTION_1_ID,
      studentId: student.studentId,
      unitId: ballot.unit.id,
      candidateId: candidateIds[0],
      candidateIds,
      receiptReference: receipt,
      castAt: new Date().toISOString(),
    });
    current.delegateCandidates = current.delegateCandidates.map((candidate) =>
      candidateIds.includes(candidate.id)
        ? { ...candidate, votesReceived: candidate.votesReceived + 1 }
        : candidate,
    );
    current.studentElectors = current.studentElectors.map((item) =>
      item.studentId === student.studentId
        ? { ...item, voterStatus: "voted", election1VotingStatus: "voted" }
        : item,
    );
    incrementStationVotes(current, ballot.unit.campusId, ELECTION_1_ID);
    return current;
  });

  const meta = access.meta ?? (await readRequestMeta());
  await opsRecordVote({
    electionId: store.election.id,
    kind: "election1",
    studentId: student.studentId,
    fullName: student.fullName,
    unitId: ballot.unit.id,
    campusId: ballot.unit.campusId,
    candidateIds,
    candidateNames: ballot.candidates
      .filter((candidate) => candidateIds.includes(candidate.id))
      .map((candidate) => candidate.fullName),
    ip: meta.ip,
    userAgent: meta.userAgent,
    workstationId: meta.workstationId,
  });

  await appendAudit({
    actorWorkId: student.studentId,
    actorName: student.fullName,
    action: "election1_vote",
    detail: `Election 1 ballot recorded for unit ${ballot.unit.id}.`,
    highRisk: false,
    entity: "vote",
    entityId: student.studentId,
  });
  await clearElectorSession();
  revalidatePath("/commission/election/election-1");
  return { ok: true, next: "/elector/submitted" };
}

export async function logoutElector() {
  await clearElectorSession();
}
