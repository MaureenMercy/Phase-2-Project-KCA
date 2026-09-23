import { NextResponse } from "next/server";
import { readSession, touchSession } from "@/lib/session";

export async function POST() {
  const session = await readSession();
  if (!session || session.state !== "authorized") {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  await touchSession(session);
  return NextResponse.json({ ok: true });
}
