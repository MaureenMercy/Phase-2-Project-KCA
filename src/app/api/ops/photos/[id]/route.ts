import { NextResponse } from "next/server";

const API_URL = process.env.SAKU_API_URL ?? "http://127.0.0.1:4000";
const API_KEY = process.env.SAKU_OPS_SECRET ?? "saku-ops-demo-key";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  try {
    const response = await fetch(`${API_URL}/photos/${encodeURIComponent(id)}`, {
      headers: { "x-saku-ops-key": API_KEY },
      cache: "no-store",
    });
    if (!response.ok) {
      return new NextResponse(null, { status: 404 });
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    return new NextResponse(buffer, {
      headers: {
        "content-type": response.headers.get("content-type") ?? "image/jpeg",
        "cache-control": "private, max-age=30",
      },
    });
  } catch {
    return new NextResponse(null, { status: 502 });
  }
}
