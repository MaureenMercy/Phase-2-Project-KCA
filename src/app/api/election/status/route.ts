import { NextResponse } from "next/server";
import { landingStatusMessage } from "@/lib/permissions";
import { readStore } from "@/lib/store";

export async function GET() {
  const store = await readStore();
  return NextResponse.json({
    name: store.election.name,
    year: store.election.year,
    stage: store.election.stage,
    message: landingStatusMessage(store.election.stage, store.election.year),
  });
}
