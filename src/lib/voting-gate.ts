import { election1, election2, stationStateFor } from "@/lib/elections";
import type { AppStore } from "@/lib/types";

export function stationForCampus(store: AppStore, campusId: string) {
  return store.pollingStations.find((station) => station.campusId === campusId) ?? null;
}

export function election1VotingBlock(store: AppStore, campusId: string): string | null {
  const election = election1(store);
  if (election.emergencyStatus === "PAUSED") {
    return "Election 1 is under an authorised election-wide freeze.";
  }
  if (election.stage !== "VOTING") {
    return "Election 1 voting is not open.";
  }
  const station = stationForCampus(store, campusId);
  if (!station) return "No polling station is mapped to this campus.";
  if (station.frozen) {
    return `${station.name} is frozen. Voting is not accepted at this station.`;
  }
  const state = stationStateFor(store, station.id, election.id);
  const status = state?.status ?? station.status;
  if (status !== "OPEN") {
    return `${station.name} has not been officially opened for Election 1.`;
  }
  return null;
}

export function election2VotingBlock(store: AppStore, campusId: string): string | null {
  const election = election2(store);
  if (store.electoralCollege.status !== "active") {
    return "The Electoral College Register is not finalised and authorised for Election 2.";
  }
  if (election.emergencyStatus === "PAUSED") {
    return "Election 2 is under an authorised election-wide freeze.";
  }
  if (election.stage !== "VOTING") {
    return "Election 2 voting is not open.";
  }
  const station = stationForCampus(store, campusId);
  if (!station) return "No polling station is mapped to this campus.";
  if (station.frozen) {
    return `${station.name} is frozen. Voting is not accepted at this station.`;
  }
  const state = stationStateFor(store, station.id, election.id);
  const status = state?.status ?? station.status;
  if (status !== "OPEN") {
    return `${station.name} has not been officially opened for Election 2.`;
  }
  return null;
}

export function newReceiptReference() {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return `BR-${Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("").toUpperCase()}`;
}

export function incrementStationVotes(store: AppStore, campusId: string, electionId: string) {
  const station = stationForCampus(store, campusId);
  if (!station) return;
  const state = store.stationElectionState.find(
    (item) => item.stationId === station.id && item.electionId === electionId,
  );
  if (state && state.status === "OPEN" && !state.frozen) {
    state.votesCast += 1;
  }
  if (store.election.id === electionId && station.status === "OPEN" && !station.frozen) {
    station.votesCast += 1;
  }
}
