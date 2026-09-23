"use server";

import { createHash, randomInt } from "node:crypto";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/actions/auth";
import { CABINET_CONTESTS, isCabinetBallotComplete } from "@/lib/electoral";
import {
  clearElectorSession,
  readElectorSession,
  saveElectorSession,
} from "@/lib/elector-session";
import { appendAudit, readStore, writeStore } from "@/lib/store";
import type { CabinetContestId } from "@/lib/types";
import { CABINET_CONTEST_IDS } from "@/lib/types";

function hashValue(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export async function requestCabinetOtp(registrationNumber: string): Promise<ActionResult> {
  const store = await readStore();
  if (store.election.emergencyStatus === "PAUSED") {
    return { ok: false, error: "Voting is paused by the Electoral Commission." };
  }
  if (store.electoralCollege.status !== "active") {
    return { ok: false, error: "The SAKU Electoral Register is not active. It is derived from finalized Election 1 results." };
  }

  const elector = store.electoralCollege.entries.find(
    (entry) =>
      entry.registrationNumber.trim().toUpperCase() === registrationNumber.trim().toUpperCase(),
  );
  if (!elector) {
    return { ok: false, error: "That registration number is not on the SAKU Electoral Register." };
  }
  if (elector.electorStatus !== "active") {
    return {
      ok: false,
      error:
        elector.electorStatus === "voted"
          ? "This elector has already voted. The OTP is no longer valid."
          : "This elector is not eligible to receive a Cabinet ballot.",
    };
  }

  const otp = String(randomInt(100000, 1000000)).padStart(6, "0");
  await writeStore((current) => {
    current.electoralCollege.entries = current.electoralCollege.entries.map((entry) =>
      entry.id === elector.id
        ? {
            ...entry,
            otpHash: hashValue(otp),
            otpDemo: otp,
            otpExpiresAt: Date.now() + 10 * 60 * 1000,
          }
        : entry,
    );
    return current;
  });
  return { ok: true, demoOtp: otp };
}

export async function verifyCabinetLogin(input: {
  registrationNumber: string;
  otp: string;
}): Promise<ActionResult> {
  const store = await readStore();
  if (store.election.emergencyStatus === "PAUSED") {
    return { ok: false, error: "Voting is paused by the Electoral Commission." };
  }
  if (store.electoralCollege.status !== "active") {
    return { ok: false, error: "The SAKU Electoral Register is not active." };
  }

  const elector = store.electoralCollege.entries.find(
    (entry) =>
      entry.registrationNumber.trim().toUpperCase() ===
      input.registrationNumber.trim().toUpperCase(),
  );
  if (!elector) {
    return { ok: false, error: "That registration number is not on the SAKU Electoral Register." };
  }
  if (elector.electorStatus === "voted") {
    return { ok: false, error: "This elector has already voted." };
  }
  if (elector.electorStatus !== "active") {
    return { ok: false, error: "This elector is not eligible." };
  }
  if (!elector.otpHash || !elector.otpExpiresAt || elector.otpExpiresAt < Date.now()) {
    return { ok: false, error: "Request a valid one-time password first." };
  }
  if (hashValue(input.otp.trim()) !== elector.otpHash) {
    return { ok: false, error: "That one-time password is invalid." };
  }

  const existing = store.cabinetDrafts.find((draft) => draft.electorId === elector.id);
  if (!existing) {
    await writeStore((current) => {
      current.cabinetDrafts.push({
        electorId: elector.id,
        selections: {},
        step: 0,
        startedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      return current;
    });
  }

  await saveElectorSession({
    kind: "delegate",
    electorId: elector.id,
    registrationNumber: elector.registrationNumber,
    fullName: elector.fullName,
    electionId: store.election.id,
    lastActivityAt: Date.now(),
  });
  return { ok: true, next: "/vote/ballot" };
}

export async function saveCabinetSelection(input: {
  contestId: CabinetContestId;
  choiceId: string;
  advance: boolean;
}): Promise<ActionResult> {
  const session = await readElectorSession();
  if (!session || session.kind !== "delegate") {
    return { ok: false, error: "Your elector session expired." };
  }

  const store = await readStore();
  const elector = store.electoralCollege.entries.find((entry) => entry.id === session.electorId);
  if (!elector || elector.electorStatus === "voted") {
    return { ok: false, error: "This elector cannot continue the ballot." };
  }

  const contest = CABINET_CONTESTS.find((item) => item.id === input.contestId);
  if (!contest) return { ok: false, error: "Unknown contest." };
  const choice = store.cabinetCandidates.find(
    (candidate) => candidate.id === input.choiceId && candidate.contestId === input.contestId,
  );
  if (!choice) return { ok: false, error: "Select one option for this contest." };

  const currentIndex = CABINET_CONTEST_IDS.indexOf(input.contestId);
  await writeStore((current) => {
    current.cabinetDrafts = current.cabinetDrafts.map((draft) =>
      draft.electorId === session.electorId
        ? {
            ...draft,
            selections: { ...draft.selections, [input.contestId]: input.choiceId },
            step: input.advance ? Math.min(currentIndex + 1, CABINET_CONTEST_IDS.length) : currentIndex,
            updatedAt: new Date().toISOString(),
          }
        : draft,
    );
    return current;
  });
  revalidatePath("/vote/ballot");
  return { ok: true, next: input.advance ? (currentIndex >= 5 ? "/vote/review" : "/vote/ballot") : undefined };
}

export async function goToCabinetStep(step: number): Promise<ActionResult> {
  const session = await readElectorSession();
  if (!session || session.kind !== "delegate") {
    return { ok: false, error: "Your elector session expired." };
  }
  await writeStore((store) => {
    store.cabinetDrafts = store.cabinetDrafts.map((draft) =>
      draft.electorId === session.electorId
        ? { ...draft, step: Math.max(0, Math.min(step, 6)), updatedAt: new Date().toISOString() }
        : draft,
    );
    return store;
  });
  revalidatePath("/vote/ballot");
  return { ok: true, next: step >= 6 ? "/vote/review" : "/vote/ballot" };
}

export async function submitCabinetVote(): Promise<ActionResult> {
  const session = await readElectorSession();
  if (!session || session.kind !== "delegate") {
    return { ok: false, error: "Your elector session expired." };
  }

  const store = await readStore();
  const elector = store.electoralCollege.entries.find((entry) => entry.id === session.electorId);
  if (!elector) return { ok: false, error: "Elector not found." };
  if (elector.electorStatus === "voted") {
    return { ok: false, error: "This vote has already been recorded." };
  }

  const draft = store.cabinetDrafts.find((item) => item.electorId === session.electorId);
  if (!draft || !isCabinetBallotComplete(draft.selections)) {
    return { ok: false, error: "Complete every contest before submitting." };
  }

  const selections = draft.selections as Record<CabinetContestId, string>;
  await writeStore((current) => {
    current.cabinetVotes.push({
      id: `cv-${crypto.randomUUID()}`,
      electionId: current.election.id,
      electorId: session.electorId,
      selections,
      submittedAt: new Date().toISOString(),
    });
    current.electoralCollege.entries = current.electoralCollege.entries.map((entry) =>
      entry.id === session.electorId
        ? {
            ...entry,
            electorStatus: "voted",
            votedAt: new Date().toISOString(),
            otpHash: null,
            otpDemo: null,
            otpExpiresAt: null,
          }
        : entry,
    );
    current.cabinetDrafts = current.cabinetDrafts.filter((item) => item.electorId !== session.electorId);
    return current;
  });
  await appendAudit({
    actorWorkId: elector.registrationNumber,
    actorName: elector.fullName,
    action: "cabinet_vote_submitted",
    detail: "Cabinet ballot submitted. OTP invalidated. Elector marked as voted.",
    highRisk: false,
    entity: "cabinet_vote",
    entityId: session.electorId,
  });
  await clearElectorSession();
  revalidatePath("/commission/election/leadership");
  return { ok: true, next: "/vote/submitted" };
}
