import { cookies } from "next/headers";
import { cookieBaseOptions } from "@/lib/session-crypto";
import type { AppStore, ElectionContext } from "@/lib/types";
import { ELECTION_CONTEXTS } from "@/lib/types";
import { election1, election2 } from "@/lib/elections";

const COOKIE = "saku_ec_context";

export function isElectionContext(value: string | undefined): value is ElectionContext {
  return ELECTION_CONTEXTS.includes(value as ElectionContext);
}

export async function readElectionContext(store?: AppStore): Promise<ElectionContext> {
  try {
    const jar = await cookies();
    const value = jar.get(COOKIE)?.value;
    if (isElectionContext(value)) return value;
  } catch {
    // Tests and non-request contexts.
  }
  return store?.activeElectionContext ?? "ELECTION_1";
}

export async function writeElectionContext(context: ElectionContext) {
  const jar = await cookies();
  jar.set(COOKIE, context, cookieBaseOptions(12 * 60 * 60));
}

export function stageForContext(store: AppStore, context: ElectionContext) {
  if (context === "ELECTION_2") return election2(store).stage;
  return election1(store).stage;
}
