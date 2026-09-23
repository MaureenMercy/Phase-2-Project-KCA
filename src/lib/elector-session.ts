import "server-only";

import { cookies } from "next/headers";
import {
  cookieBaseOptions,
  decryptElectorPayload,
  ELECTOR_COOKIE,
  encryptElectorPayload,
} from "@/lib/session-crypto";
import type { ElectorSessionPayload } from "@/lib/types";

export async function readElectorSession() {
  const jar = await cookies();
  const token = jar.get(ELECTOR_COOKIE)?.value;
  if (!token) return null;
  return decryptElectorPayload(token);
}

export async function saveElectorSession(session: ElectorSessionPayload) {
  const token = await encryptElectorPayload({
    ...session,
    lastActivityAt: Date.now(),
  });
  const jar = await cookies();
  jar.set(ELECTOR_COOKIE, token, cookieBaseOptions(2 * 60 * 60));
}

export async function clearElectorSession() {
  const jar = await cookies();
  jar.delete(ELECTOR_COOKIE);
}
