"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/actions/auth";
import { opsHealth, opsSavePhoto, opsSavePolicy } from "@/lib/ops-client";
import { isAllowedNow } from "@/lib/permissions";
import { requireAuthorizedSession } from "@/lib/session";
import { appendAudit, readStore } from "@/lib/store";
import { parseAllowlist } from "../../../server/ip";

export async function saveAccessPolicy(input: {
  mode: "open" | "allowlist";
  allowedIpsText: string;
  applyToCommission: boolean;
}): Promise<ActionResult> {
  const session = await requireAuthorizedSession();
  const store = await readStore();
  if (!isAllowedNow(session.role!, "manage_commission_records", store.election.stage)) {
    return { ok: false, error: "Only Commission officers with configuration authority can change workstation access." };
  }

  const health = await opsHealth();
  if (!health?.ok) {
    return {
      ok: false,
      error: "The operations API is not running. Start it with npm run api (MongoDB on port 27017, API on port 4000).",
    };
  }

  const mode = input.mode === "allowlist" ? "allowlist" : "open";
  const allowedIps = parseAllowlist(input.allowedIpsText);
  if (mode === "allowlist" && allowedIps.length === 0) {
    return { ok: false, error: "Restricted mode needs at least one workstation IP or CIDR range." };
  }

  const saved = await opsSavePolicy({
    mode,
    allowedIps,
    applyToCommission: input.applyToCommission,
    updatedBy: session.workId,
  });
  if (!saved) {
    return { ok: false, error: "The operations API rejected the access policy." };
  }

  await appendAudit({
    actorWorkId: session.workId,
    actorName: session.fullName,
    action: "access_policy_updated",
    detail:
      mode === "open"
        ? "Voting desks are open to any workstation IP."
        : `Voting desks are restricted to ${allowedIps.join(", ")}.`,
    highRisk: mode === "allowlist",
    entity: "access_policy",
    entityId: "default",
  });
  revalidatePath("/commission/access");
  revalidatePath("/commission/tracking");
  return { ok: true };
}

export async function uploadCandidatePhoto(input: {
  candidateId: string;
  kind: "delegate" | "leadership" | "cabinet";
  mimeType: string;
  data: string;
}): Promise<ActionResult> {
  const session = await requireAuthorizedSession();
  const store = await readStore();
  if (!isAllowedNow(session.role!, "approve_candidates", store.election.stage)) {
    return { ok: false, error: "Candidate portraits can only be placed by officers who may manage nominations." };
  }
  if (!input.candidateId || !input.mimeType.startsWith("image/") || input.data.length < 32) {
    return { ok: false, error: "Choose a JPEG or PNG portrait of the candidate." };
  }
  if (input.data.length > 4_500_000) {
    return { ok: false, error: "Keep the portrait under about 3 MB." };
  }

  const saved = await opsSavePhoto({
    candidateId: input.candidateId,
    kind: input.kind,
    mimeType: input.mimeType,
    data: input.data,
    uploadedBy: session.workId,
  });
  if (!saved) {
    return {
      ok: false,
      error: "The operations API is not running, so the portrait could not be stored in MongoDB.",
    };
  }

  await appendAudit({
    actorWorkId: session.workId,
    actorName: session.fullName,
    action: "candidate_photo_uploaded",
    detail: `Portrait stored for candidate ${input.candidateId}.`,
    highRisk: false,
    entity: "candidate_photo",
    entityId: input.candidateId,
  });
  revalidatePath("/commission/candidates");
  revalidatePath("/commission/election/election-1");
  revalidatePath("/commission/election/leadership");
  return { ok: true };
}
