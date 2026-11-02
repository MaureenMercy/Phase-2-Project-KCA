import { opsListPhotos, opsListVotes, opsPhotoUrl } from "@/lib/ops-client";
import { readStore } from "@/lib/store";
import type { AppStore } from "@/lib/types";

export async function overlayPersistedVotes(store: AppStore): Promise<AppStore> {
  const [election1, cabinet] = await Promise.all([
    opsListVotes("election1"),
    opsListVotes("cabinet"),
  ]);
  if (!election1.length && !cabinet.length) return store;

  const votedStudents = new Set(election1.map((vote) => vote.studentId));
  const votedElectors = new Set(cabinet.map((vote) => vote.studentId));
  const alreadyCounted = new Set(store.delegateVotes.map((vote) => vote.studentId));
  const extraVotes = new Map<string, number>();
  for (const vote of election1) {
    if (alreadyCounted.has(vote.studentId)) continue;
    for (const id of vote.candidateIds ?? []) {
      extraVotes.set(id, (extraVotes.get(id) ?? 0) + 1);
    }
  }

  return {
    ...store,
    studentElectors: store.studentElectors.map((student) =>
      votedStudents.has(student.studentId) ? { ...student, voterStatus: "voted" } : student,
    ),
    delegateCandidates: store.delegateCandidates.map((candidate) =>
      extraVotes.has(candidate.id)
        ? { ...candidate, votesReceived: candidate.votesReceived + (extraVotes.get(candidate.id) ?? 0) }
        : candidate,
    ),
    electoralCollege: {
      ...store.electoralCollege,
      entries: store.electoralCollege.entries.map((entry) =>
        votedElectors.has(entry.registrationNumber) || votedElectors.has(entry.id)
          ? { ...entry, electorStatus: "voted" as const, votedAt: entry.votedAt ?? new Date().toISOString() }
          : entry,
      ),
    },
  };
}

export async function readStoreWithOps() {
  return overlayPersistedVotes(await readStore());
}

export async function overlayCandidatePhotos<T extends { id: string; photo?: string }>(
  candidates: T[],
): Promise<T[]> {
  const uploaded = new Set((await opsListPhotos()).map((item) => item.candidateId));
  return candidates.map((candidate) =>
    uploaded.has(candidate.id)
      ? { ...candidate, photo: opsPhotoUrl(candidate.id) }
      : candidate,
  );
}
