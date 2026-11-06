import { CABINET_CONTESTS } from "@/lib/electoral";
import type { CabinetCandidate, CabinetContestId, CandidateRecord } from "@/lib/types";
import { portraitDataUri } from "@/lib/portraits";

const POSITION_TO_CONTEST: Record<string, CabinetContestId> = {
  President: "president-ticket",
  "Secretary General": "secretary-general",
  "Treasurer / Finance Secretary": "treasurer",
  "Academic Secretary": "academic",
  "Special Interests Secretary": "special-interests",
  "Sports & Entertainment Secretary": "sports",
};

export function contestIdForLeadership(candidate: Pick<CandidateRecord, "position" | "contestId">) {
  if (candidate.contestId) return candidate.contestId;
  return POSITION_TO_CONTEST[candidate.position] ?? null;
}

export function leadershipPositionLabel(contestId: CabinetContestId) {
  return CABINET_CONTESTS.find((contest) => contest.id === contestId)?.title ?? contestId;
}

export function toCabinetCandidate(candidate: CandidateRecord, hue = 210): CabinetCandidate | null {
  const contestId = contestIdForLeadership(candidate);
  if (!contestId || candidate.status === "rejected") return null;
  const photo = candidate.photo || portraitDataUri(candidate.fullName, hue);
  if (contestId === "president-ticket") {
    return {
      id: `cab-from-${candidate.id}`,
      contestId,
      fullName: candidate.fullName,
      photo,
      runningMateName: candidate.runningMateName || "Running mate to be named",
      runningMatePhoto: portraitDataUri(candidate.runningMateName || candidate.fullName, hue + 40),
      ticketLabel: candidate.ticket,
      status: "approved",
    };
  }
  return {
    id: `cab-from-${candidate.id}`,
    contestId,
    fullName: candidate.fullName,
    photo,
    ticketLabel: candidate.ticket,
    status: "approved",
  };
}

export function upsertCabinetCandidate(list: CabinetCandidate[], next: CabinetCandidate) {
  const index = list.findIndex((item) => item.id === next.id);
  if (index === -1) return [...list, next];
  return list.map((item, i) => (i === index ? { ...item, ...next } : item));
}
