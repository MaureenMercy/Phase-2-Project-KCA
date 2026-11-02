import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { cookies } from "next/headers";
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
import type { AppStore, AuditEvent } from "@/lib/types";
import { STORE_VERSION } from "@/lib/types";

const STORE_PATH = path.join(process.cwd(), "data", "store.json");
const COOKIE_MAX_AGE = 12 * 60 * 60;
const STATE_COOKIE_AT = "saku_state_at";

type GlobalStore = {
  __sakuStore?: AppStore;
  __sakuStoreAt?: number;
  __sakuWriteQueue?: Promise<void>;
};

const globalStore = globalThis as typeof globalThis & GlobalStore;

function migrate(parsed: Partial<AppStore>): AppStore {
  const initial = createInitialStore();
  if (parsed.version !== STORE_VERSION || !parsed.electoralUnits || !parsed.campuses) {
    return {
      ...initial,
      auditLog: parsed.auditLog?.length ? parsed.auditLog : initial.auditLog,
    };
  }
  return { ...initial, ...parsed, version: STORE_VERSION } as AppStore;
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

export async function readStore(): Promise<AppStore> {
  if (!canPersistToDisk()) {
    const fromCookies = await readStoreFromCookies();
    const memoryAt = globalStore.__sakuStoreAt ?? 0;
    const cookieAt = fromCookies?.at ?? 0;
    if (globalStore.__sakuStore && memoryAt >= cookieAt) {
      return structuredClone(globalStore.__sakuStore);
    }
    if (fromCookies) {
      globalStore.__sakuStore = fromCookies.store;
      globalStore.__sakuStoreAt = fromCookies.at;
      return structuredClone(fromCookies.store);
    }
  }

  if (globalStore.__sakuStore) return structuredClone(globalStore.__sakuStore);

  try {
    const raw = await readFile(STORE_PATH, "utf8");
    const parsed = migrate(JSON.parse(raw) as Partial<AppStore>);
    globalStore.__sakuStore = parsed;
    return structuredClone(parsed);
  } catch {
    const initial = createInitialStore();
    globalStore.__sakuStore = initial;
    await persist(initial);
    return structuredClone(initial);
  }
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
