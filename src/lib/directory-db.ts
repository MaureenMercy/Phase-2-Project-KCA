import "server-only";

import { opsFindAccount, opsFindMember, opsSyncDirectory } from "@/lib/ops-client";
import { COMMISSION_MEMBERS, findCommissionMemberByUserId, findDirectoryUser, findDirectoryUserById, INSTITUTIONAL_DIRECTORY } from "@/lib/seed";
import type { CommissionMember, InstitutionalUser } from "@/lib/types";

let directorySync: Promise<boolean> | null = null;

export function ensureDirectorySynced() {
  directorySync ??= opsSyncDirectory({
    accounts: INSTITUTIONAL_DIRECTORY,
    members: COMMISSION_MEMBERS,
  }).then((result) => {
    if (!result) directorySync = null;
    return Boolean(result);
  });
  return directorySync;
}

export async function resolveDirectoryUser(workId: string): Promise<InstitutionalUser | null> {
  await ensureDirectorySynced();
  return (await opsFindAccount({ workId })) ?? findDirectoryUser(workId);
}

export async function resolveDirectoryUserById(id: string): Promise<InstitutionalUser | null> {
  await ensureDirectorySynced();
  return (await opsFindAccount({ id })) ?? findDirectoryUserById(id);
}

export async function resolveCommissionMember(userId: string): Promise<CommissionMember | null> {
  await ensureDirectorySynced();
  return (await opsFindMember(userId)) ?? findCommissionMemberByUserId(userId);
}
