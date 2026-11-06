import { NextResponse } from "next/server";
import { opsDemoReset } from "@/lib/ops-client";
import { resetStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST() {
  if (process.env.SAKU_DEMO !== "1") {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  await opsDemoReset();
  await resetStore();
  return NextResponse.json({ ok: true });
}
