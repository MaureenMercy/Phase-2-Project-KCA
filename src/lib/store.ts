import "server-only";

import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { cookies } from "next/headers";
import { ensureDirectorySynced } from "@/lib/directory-db";
import { mergeEnrolledIntoStore } from "@/lib/enrolled-students";
import { opsListEnrolled, opsLoadRegistry, opsSaveRegistry } from "@/lib/ops-client";
import { last4, mockNationalId, mockPhone } from "@/lib/identity";
import { createInitialStore } from "@/lib/seed";
import { cookieBaseOptions } from "@/lib/session-crypto";
import {
  decodeStorePatch,
  encodeStorePatch,
  restoreStorePhotos,
  splitCookieChunks,
  STATE_COOKIE_COUNT,
  STATE_COOKIE_PREFIX,
} from "@/lib/store-persist";
import type { AppStore, AuditEvent, CandidatePortalApplication } from "@/lib/types";
import { STORE_VERSION } from "@/lib/types";

function isPortalApplicationRecord(item: unknown): item is CandidatePortalApplication {
  return Boolean(
    item &&
      typeof item === "object" &&
      "currentStep" in item &&
      "ballotParticipationStatus" in item,
  );
}

const STORE_PATH = path.join(process.cwd(), "data", "store.json");
const COOKIE_MAX_AGE = 12 * 60 * 60;
const STATE_COOKIE_AT = "saku_state_at";

type GlobalStore = {
  __sakuStore?: AppStore;
  __sakuStoreAt?: number;
  __sakuWriteQueue?: Promise<void>;
  __sakuRegistrySynced?: boolean;
};

const globalStore = globalThis as typeof globalThis & GlobalStore;

function migrate(parsed: Partial<AppStore>): AppStore {
  const initial = createInitialStore();
  if (!parsed.electoralUnits || !parsed.campuses) {
    return {
      ...initial,
      auditLog: parsed.auditLog?.length ? parsed.auditLog : initial.auditLog,
    };
  }
  const merged = { ...initial, ...parsed, version: STORE_VERSION } as AppStore;
  merged.voterProfiles = parsed.voterProfiles ?? initial.voterProfiles;
  merged.voterHistory = parsed.voterHistory ?? initial.voterHistory;
  merged.voterNotifications = parsed.voterNotifications ?? initial.voterNotifications;
  merged.academicCorrectionRequests = parsed.academicCorrectionRequests ?? initial.academicCorrectionRequests;
  merged.identityDocumentPolicy = parsed.identityDocumentPolicy ?? initial.identityDocumentPolicy;
  merged.agentInvitations = parsed.agentInvitations ?? initial.agentInvitations;
  merged.agentNotifications = parsed.agentNotifications ?? initial.agentNotifications;
  merged.observationInstructions = parsed.observationInstructions ?? initial.observationInstructions;
  merged.agentPolicy = parsed.agentPolicy ?? initial.agentPolicy;
  merged.studentElectors = (parsed.studentElectors ?? initial.studentElectors).map((student) => ({
    ...student,
    phoneNumber: student.phoneNumber ?? mockPhone(student.studentId),
    nationalIdLast4: student.nationalIdLast4 ?? last4(mockNationalId(student.studentId)),
  }));
  merged.studentIdentities = parsed.studentIdentities?.length
    ? parsed.studentIdentities
    : initial.studentIdentities;
  merged.candidateProfiles = parsed.candidateProfiles ?? initial.candidateProfiles;
  const parsedApps = (parsed.candidateApplications ?? []) as unknown[];
  const portalFromLegacy = parsedApps.filter(isPortalApplicationRecord);
  const commissionApps = parsedApps.filter((item) => !isPortalApplicationRecord(item));
  merged.candidatePortalApplications = parsed.candidatePortalApplications?.length
    ? parsed.candidatePortalApplications
    : portalFromLegacy.length
      ? portalFromLegacy
      : initial.candidatePortalApplications;
  merged.candidateApplications = commissionApps.length
    ? (commissionApps as AppStore["candidateApplications"])
    : initial.candidateApplications;
  merged.agentNominations = parsed.agentNominations ?? initial.agentNominations;
  merged.correctionRequests = parsed.correctionRequests ?? initial.correctionRequests;
  merged.portalNotifications = parsed.portalNotifications ?? initial.portalNotifications;
  merged.portalConfig = parsed.portalConfig ?? initial.portalConfig;
  return merged;
}

function canPersistToDisk() {
  return process.env.VERCEL !== "1" && process.env.SAKU_PERSIST !== "0";
}

async function persist(store: AppStore, at = Date.now()) {
  if (!canPersistToDisk()) {
    await persistToCookies(store, at);
    return;
  }
  try {
    await mkdir(path.dirname(STORE_PATH), { recursive: true });
    await writeFile(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
  } catch {
    await persistToCookies(store, at);
  }
  await opsSaveRegistry(store, at);
}

async function loadFromFile(): Promise<{ store: AppStore; at: number }> {
  try {
    const [raw, info] = await Promise.all([readFile(STORE_PATH, "utf8"), stat(STORE_PATH)]);
    return { store: migrate(JSON.parse(raw) as Partial<AppStore>), at: info.mtimeMs };
  } catch {
    return { store: createInitialStore(), at: 0 };
  }
}

async function reconcileRegistry() {
  if (!canPersistToDisk() || globalStore.__sakuRegistrySynced || !globalStore.__sakuStore) return;
  const localAt = globalStore.__sakuStoreAt ?? 0;
  const remote = await opsLoadRegistry();
  const remoteAt = remote?.updatedAt ?? 0;
  if (remote && remoteAt > localAt && remote.payload && typeof remote.payload === "object") {
    const store = migrate(remote.payload as Partial<AppStore>);
    globalStore.__sakuStore = store;
    globalStore.__sakuStoreAt = remoteAt;
  } else {
    const at = localAt || Date.now();
    globalStore.__sakuStoreAt = at;
    await opsSaveRegistry(globalStore.__sakuStore, at);
  }
  globalStore.__sakuRegistrySynced = true;
  await ensureDirectorySynced();
}

async function persistToCookies(store: AppStore, at: number) {
  try {
    const jar = await cookies();
    const chunks = splitCookieChunks(encodeStorePatch(store));
    const options = cookieBaseOptions(COOKIE_MAX_AGE);
    jar.set(STATE_COOKIE_COUNT, String(chunks.length), options);
    jar.set(STATE_COOKIE_AT, String(at), options);
    chunks.forEach((chunk, index) => {
      jar.set(`${STATE_COOKIE_PREFIX}${index}`, chunk, options);
    });
    for (let index = chunks.length; index < 24; index += 1) {
      jar.delete(`${STATE_COOKIE_PREFIX}${index}`);
    }
  } catch {
    // Outside a request (tests) or if the cookie jar is read-only.
  }
}

async function readStoreFromCookies(): Promise<{ store: AppStore; at: number } | null> {
  try {
    const jar = await cookies();
    const count = Number(jar.get(STATE_COOKIE_COUNT)?.value ?? 0);
    if (!Number.isInteger(count) || count < 1) return null;
    const encoded = Array.from({ length: count }, (_, index) =>
      jar.get(`${STATE_COOKIE_PREFIX}${index}`)?.value ?? "",
    ).join("");
    if (!encoded) return null;
    const parsed = migrate(decodeStorePatch(encoded));
    return {
      store: restoreStorePhotos(parsed, createInitialStore()),
      at: Number(jar.get(STATE_COOKIE_AT)?.value ?? 0),
    };
  } catch {
    return null;
  }
}

async function withEnrolledStudents(store: AppStore): Promise<AppStore> {
  return mergeEnrolledIntoStore(store, await opsListEnrolled());
}

export async function readStore(): Promise<AppStore> {
  if (!canPersistToDisk()) {
    const fromCookies = await readStoreFromCookies();
    const memoryAt = globalStore.__sakuStoreAt ?? 0;
    const cookieAt = fromCookies?.at ?? 0;
    if (globalStore.__sakuStore && memoryAt >= cookieAt) {
      return withEnrolledStudents(structuredClone(globalStore.__sakuStore));
    }
    if (fromCookies) {
      globalStore.__sakuStore = fromCookies.store;
      globalStore.__sakuStoreAt = fromCookies.at;
      return withEnrolledStudents(structuredClone(fromCookies.store));
    }
  }

  if (!globalStore.__sakuStore) {
    const loaded = await loadFromFile();
    globalStore.__sakuStore = loaded.store;
    globalStore.__sakuStoreAt = loaded.at;
  }

  await reconcileRegistry();
  return withEnrolledStudents(structuredClone(globalStore.__sakuStore!));
}

export async function writeStore(
  updater: (store: AppStore) => AppStore | void,
): Promise<AppStore> {
  const queue = globalStore.__sakuWriteQueue ?? Promise.resolve();
  const next = queue.then(async () => {
    const current = await readStore();
    const updated = updater(current) ?? current;
    const at = Date.now();
    globalStore.__sakuStore = updated;
    globalStore.__sakuStoreAt = at;
    await persist(updated, at);
    return updated;
  });
  globalStore.__sakuWriteQueue = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}

export async function appendAudit(
  event: Omit<AuditEvent, "id" | "at"> & { at?: string },
) {
  const entry: AuditEvent = {
    id: `a-${crypto.randomUUID()}`,
    at: event.at ?? new Date().toISOString(),
    actorWorkId: event.actorWorkId,
    actorName: event.actorName,
    action: event.action,
    detail: event.detail,
    highRisk: event.highRisk,
    entity: event.entity,
    entityId: event.entityId,
    oldValue: event.oldValue,
    newValue: event.newValue,
    reason: event.reason,
    stationId: event.stationId,
    electionStage: event.electionStage,
  };

  await writeStore((store) => {
    store.auditLog = [entry, ...store.auditLog].slice(0, 400);
    return store;
  });

  return entry;
}

export async function resetStore() {
  const initial = createInitialStore();
  const at = Date.now();
  globalStore.__sakuStore = initial;
  globalStore.__sakuStoreAt = at;
  await persist(initial, at);
  return initial;
}
