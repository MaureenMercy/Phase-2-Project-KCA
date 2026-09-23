import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createInitialStore } from "@/lib/seed";
import type { AppStore, AuditEvent } from "@/lib/types";

const STORE_PATH = path.join(process.cwd(), "data", "store.json");

type GlobalStore = {
  __sakuStore?: AppStore;
  __sakuWriteQueue?: Promise<void>;
};

const globalStore = globalThis as typeof globalThis & GlobalStore;

async function persist(store: AppStore) {
  await mkdir(path.dirname(STORE_PATH), { recursive: true });
  await writeFile(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
}

export async function readStore(): Promise<AppStore> {
  if (globalStore.__sakuStore) return structuredClone(globalStore.__sakuStore);

  try {
    const raw = await readFile(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw) as AppStore;
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
    globalStore.__sakuStore = updated;
    await persist(updated);
    return updated;
  });
  globalStore.__sakuWriteQueue = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}

export async function appendAudit(event: Omit<AuditEvent, "id" | "at"> & { at?: string }) {
  const entry: AuditEvent = {
    id: `a-${crypto.randomUUID()}`,
    at: event.at ?? new Date().toISOString(),
    actorWorkId: event.actorWorkId,
    actorName: event.actorName,
    action: event.action,
    detail: event.detail,
    highRisk: event.highRisk,
  };

  await writeStore((store) => {
    store.auditLog = [entry, ...store.auditLog].slice(0, 200);
    return store;
  });

  return entry;
}
