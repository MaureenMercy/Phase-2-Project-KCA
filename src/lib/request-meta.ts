import { cookies, headers } from "next/headers";

export const WORKSTATION_COOKIE = "saku_workstation";

function normalizeIp(value: string | null | undefined) {
  if (!value) return "";
  const first = value.split(",")[0]?.trim() ?? "";
  if (first.startsWith("::ffff:")) return first.slice(7);
  if (first === "::1") return "127.0.0.1";
  return first;
}

export async function readRequestMeta() {
  const headerStore = await headers();
  const forwarded = headerStore.get("x-forwarded-for");
  const real = headerStore.get("x-real-ip");
  const ip = normalizeIp(forwarded ?? real ?? "");
  const userAgent = headerStore.get("user-agent") ?? "";
  const jar = await cookies();
  const workstationId = jar.get(WORKSTATION_COOKIE)?.value ?? "";
  return { ip, userAgent, workstationId };
}

export async function ensureWorkstationMeta() {
  const meta = await readRequestMeta();
  if (meta.workstationId) return meta;
  const workstationId = `ws-${crypto.randomUUID()}`;
  const jar = await cookies();
  jar.set(WORKSTATION_COOKIE, workstationId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 180,
  });
  return { ...meta, workstationId };
}
