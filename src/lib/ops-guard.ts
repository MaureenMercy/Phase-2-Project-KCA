import { opsCheckAccess, opsLogEvent } from "@/lib/ops-client";
import { ensureWorkstationMeta } from "@/lib/request-meta";

export async function assertSystemAccess(input: {
  actor: string;
  path: string;
  action: string;
  surface: "voting" | "commission";
}) {
  const meta = await ensureWorkstationMeta();
  const check = await opsCheckAccess(meta.ip);
  const policyApplies =
    input.surface === "voting" || Boolean(check?.applyToCommission);
  const allowed = check ? (policyApplies ? check.allowed : true) : true;
  const reason =
    check?.reason ??
    "Operations API is offline; access was allowed for this prototype request.";
  await opsLogEvent({
    ...meta,
    action: input.action,
    actor: input.actor,
    path: input.path,
    allowed,
    reason: policyApplies
      ? reason
      : "Commission access is unrestricted while the allow-list applies only to voting desks.",
  });
  if (!allowed) {
    return { ok: false as const, error: reason, meta };
  }
  return { ok: true as const, meta, reason };
}

export async function assertVotingAccess(input: {
  actor: string;
  path: string;
  action: string;
}) {
  return assertSystemAccess({ ...input, surface: "voting" });
}
