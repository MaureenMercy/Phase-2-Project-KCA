import type {
  AppStore,
  ElectionContext,
  ElectionRecord,
  StationElectionState,
} from "@/lib/types";
import { ELECTION_1_ID, ELECTION_2_ID } from "@/lib/seed-electorate";

export function election1(store: AppStore): ElectionRecord {
  return store.elections.find((item) => item.contest === "ELECTION_1_DELEGATE") ?? store.election;
}

export function election2(store: AppStore): ElectionRecord {
  return (
    store.elections.find((item) => item.contest === "SAKU_LEADERSHIP") ??
    store.elections.find((item) => item.id === ELECTION_2_ID) ??
    store.election
  );
}

export function electionById(store: AppStore, id: string) {
  return store.elections.find((item) => item.id === id) ?? null;
}

export function contextElection(store: AppStore): ElectionRecord {
  if (store.activeElectionContext === "ELECTION_2") return election2(store);
  return election1(store);
}

export function contextLabel(context: ElectionContext) {
  switch (context) {
    case "ELECTION_1":
      return "Election 1 — Delegates";
    case "ELECTORAL_COLLEGE":
      return "Electoral College";
    case "ELECTION_2":
      return "Election 2 — SAKU Council";
  }
}

export function stationStateFor(
  store: AppStore,
  stationId: string,
  electionId = contextElection(store).id,
): StationElectionState | null {
  return (
    store.stationElectionState.find(
      (item) => item.stationId === stationId && item.electionId === electionId,
    ) ?? null
  );
}

export function syncLegacyElection(store: AppStore) {
  const active = contextElection(store);
  store.election = active;
  return store;
}

export function isElection1Id(id: string) {
  return id === ELECTION_1_ID || id.endsWith("-e1");
}

export function liveTotalsHidden(election: ElectionRecord) {
  return election.stage === "VOTING" || election.stage === "REGISTRATION";
}
