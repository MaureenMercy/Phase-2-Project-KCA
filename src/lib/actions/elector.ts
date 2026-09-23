"use server";

import { revalidatePath } from "next/cache";
import { generateElection1Ballot, unitForStudent } from "@/lib/electoral";
import { clearElectorSession, saveElectorSession } from "@/lib/elector-session";
import { appendAudit, readStore, writeStore } from "@/lib/store";
import type { ActionResult } from "@/lib/actions/auth";

const STUDENT_PIN = "SAKU2026";

export async function studentElectorLogin(input: {
  studentId: string;
  pin: string;
}): Promise<ActionResult> {
  const store = await readStore();
  if (store.election.emergencyStatus === "PAUSED") {
    return { ok: false, error: "Voting is paused by the Electoral Commission." };
  }
  if (store.election.stage !== "VOTING" || store.election.contest !== "ELECTION_1_DELEGATE") {
    return { ok: false, error: "Election 1 voting is not open." };
  }

  const student = store.studentElectors.find(
    (item) => item.studentId.trim().toUpperCase() === input.studentId.trim().toUpperCase(),
  );
  if (!student || input.pin !== STUDENT_PIN) {
    return { ok: false, error: "Student ID or demonstration PIN is incorrect." };
  }
  if (student.eligibilityStatus !== "eligible") {
    return { ok: false, error: "This student is not eligible for Election 1." };
  }
  if (student.voterStatus === "voted") {
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
    electionId: store.election.id,
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

  const store = await readStore();
  const student = store.studentElectors.find((item) => item.studentId === session.electorId);
  if (!student) return { ok: false, error: "Elector record not found." };
  if (student.voterStatus === "voted") {
    return { ok: false, error: "This student has already voted." };
  }

  const ballot = generateElection1Ballot(store, student);
  if ("error" in ballot) return { ok: false, error: ballot.error };
  if (!ballot.seatsConfigured || ballot.seats === null) {
    return { ok: false, error: "This electoral contest cannot open without a configured seat allocation." };
  }
  if (candidateIds.length === 0 || candidateIds.length > ballot.seats) {
    return { ok: false, error: `Select up to ${ballot.seats} candidate${ballot.seats === 1 ? "" : "s"} from your electoral unit.` };
  }
  const allowed = new Set(ballot.candidates.map((item) => item.id));
  if (candidateIds.some((id) => !allowed.has(id))) {
    return { ok: false, error: "You may only vote for candidates in your electoral unit." };
  }

  await writeStore((current) => {
    current.delegateVotes.push({
      id: `dv-${crypto.randomUUID()}`,
      electionId: current.election.id,
      studentId: student.studentId,
      unitId: ballot.unit.id,
      candidateIds,
      castAt: new Date().toISOString(),
    });
    current.delegateCandidates = current.delegateCandidates.map((candidate) =>
      candidateIds.includes(candidate.id)
        ? { ...candidate, votesReceived: candidate.votesReceived + 1 }
        : candidate,
    );
    current.studentElectors = current.studentElectors.map((item) =>
      item.studentId === student.studentId ? { ...item, voterStatus: "voted" } : item,
    );
    const station = current.pollingStations.find((item) => item.campusId === ballot.unit.campusId);
    if (station && station.status === "OPEN") {
      station.votesCast += 1;
    }
    return current;
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
