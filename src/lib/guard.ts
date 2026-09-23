import "server-only";

import { isAllowedNow, isHighRisk } from "@/lib/permissions";
import { requireAuthorizedSession } from "@/lib/session";
import { isReauthFresh } from "@/lib/session-crypto";
import { readStore } from "@/lib/store";
import type { ElectoralPermission } from "@/lib/types";

export async function assertPermission(permission: ElectoralPermission) {
  const session = await requireAuthorizedSession();
  const store = await readStore();
  if (!session.role || !isAllowedNow(session.role, permission, store.election.stage)) {
    return {
      session,
      store,
      error:
        "Your Electoral Commission authority does not permit this action at the current election stage.",
    };
  }
  if (isHighRisk(permission) && !isReauthFresh(session)) {
    return { session, store, needsReauth: true as const };
  }
  return { session, store };
}

export function assignedStationId(session: { pollingStationIds?: string[] }) {
  return session.pollingStationIds?.[0] ?? null;
}
