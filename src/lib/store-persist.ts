import { gunzipSync, gzipSync } from "node:zlib";
import type { AppStore } from "@/lib/types";
import { STORE_VERSION } from "@/lib/types";

const COOKIE_PREFIX = "saku_state_";
const COOKIE_COUNT = "saku_state_n";
const CHUNK = 3200;
const MAX_AUDIT = 80;

type PhotoIndex = {
  candidates: Map<string, string | undefined>;
  delegateCandidates: Map<string, string>;
  cabinetCandidates: Map<string, { photo: string; runningMatePhoto?: string }>;
};

export function stripStorePhotos(store: AppStore): AppStore {
  return {
    ...store,
    auditLog: store.auditLog.slice(0, MAX_AUDIT),
    candidates: store.candidates.map(({ photo: _photo, ...rest }) => rest),
    delegateCandidates: store.delegateCandidates.map(({ photo: _photo, ...rest }) => ({
      ...rest,
      photo: "",
    })),
    cabinetCandidates: store.cabinetCandidates.map(
      ({ photo: _photo, runningMatePhoto: _mate, ...rest }) => ({
        ...rest,
        photo: "",
      }),
    ),
  };
}

export function encodeStorePatch(store: AppStore) {
  const json = JSON.stringify(stripStorePhotos(store));
  return gzipSync(Buffer.from(json)).toString("base64url");
}

export function decodeStorePatch(encoded: string): AppStore {
  const json = gunzipSync(Buffer.from(encoded, "base64url")).toString("utf8");
  return JSON.parse(json) as AppStore;
}

export function splitCookieChunks(encoded: string) {
  const chunks: string[] = [];
  for (let i = 0; i < encoded.length; i += CHUNK) {
    chunks.push(encoded.slice(i, i + CHUNK));
  }
  return chunks;
}

function photoIndex(seed: AppStore): PhotoIndex {
  return {
    candidates: new Map(seed.candidates.map((item) => [item.id, item.photo])),
    delegateCandidates: new Map(seed.delegateCandidates.map((item) => [item.id, item.photo])),
    cabinetCandidates: new Map(
      seed.cabinetCandidates.map((item) => [
        item.id,
        { photo: item.photo, runningMatePhoto: item.runningMatePhoto },
      ]),
    ),
  };
}

export function restoreStorePhotos(parsed: AppStore, seed: AppStore): AppStore {
  const photos = photoIndex(seed);
  return {
    ...seed,
    ...parsed,
    version: STORE_VERSION,
    candidates: (parsed.candidates ?? seed.candidates).map((item) => ({
      ...item,
      photo: item.photo || photos.candidates.get(item.id),
    })),
    delegateCandidates: (parsed.delegateCandidates ?? seed.delegateCandidates).map((item) => ({
      ...item,
      photo: item.photo || photos.delegateCandidates.get(item.id) || seed.delegateCandidates[0]?.photo || "",
    })),
    cabinetCandidates: (parsed.cabinetCandidates ?? seed.cabinetCandidates).map((item) => {
      const seeded = photos.cabinetCandidates.get(item.id);
      return {
        ...item,
        photo: item.photo || seeded?.photo || "",
        runningMatePhoto: item.runningMatePhoto || seeded?.runningMatePhoto,
      };
    }),
  };
}

export const STATE_COOKIE_PREFIX = COOKIE_PREFIX;
export const STATE_COOKIE_COUNT = COOKIE_COUNT;
