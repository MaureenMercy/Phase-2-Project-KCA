"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/actions/auth";
import { writeElectionContext } from "@/lib/election-context";
import { requireAuthorizedSession } from "@/lib/session";
import { writeStore } from "@/lib/store";
import { syncLegacyElection } from "@/lib/elections";
import type { ElectionContext } from "@/lib/types";
import { ELECTION_CONTEXTS } from "@/lib/types";

export async function switchElectionContext(context: ElectionContext): Promise<ActionResult> {
  await requireAuthorizedSession();
  if (!ELECTION_CONTEXTS.includes(context)) {
    return { ok: false, error: "Unknown election context." };
  }
  await writeElectionContext(context);
  await writeStore((store) => {
    store.activeElectionContext = context;
    syncLegacyElection(store);
    return store;
  });
  revalidatePath("/", "layout");
  return { ok: true };
}
