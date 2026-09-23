"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/actions/auth";
import { assertPermission } from "@/lib/guard";
import { appendAudit, writeStore } from "@/lib/store";

export async function publishNotice(input: {
  title: string;
  body: string;
  audience: "public" | "students" | "delegates";
}): Promise<ActionResult> {
  const gate = await assertPermission("manage_media");
  if ("error" in gate && gate.error) return { ok: false, error: gate.error };
  if (!input.title.trim() || !input.body.trim()) {
    return { ok: false, error: "Title and body are required." };
  }

  await writeStore((store) => {
    store.notices = [
      {
        id: `notice-${crypto.randomUUID()}`,
        title: input.title.trim(),
        body: input.body.trim(),
        audience: input.audience,
        published: true,
        createdAt: new Date().toISOString(),
        createdBy: gate.session.fullName,
      },
      ...store.notices,
    ];
    return store;
  });
  await appendAudit({
    actorWorkId: gate.session.workId,
    actorName: gate.session.fullName,
    action: "publish_notice",
    detail: `Published public notice: ${input.title.trim()}`,
    highRisk: false,
  });
  revalidatePath("/commission/media");
  return { ok: true };
}
