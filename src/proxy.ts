import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  decryptPayload,
  isIdleExpired,
  SESSION_COOKIE,
} from "@/lib/session-crypto";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const decrypted = token ? await decryptPayload(token) : null;
  const session = decrypted && !isIdleExpired(decrypted) ? decrypted : null;

  const login = new URL("/commission/login", request.url);
  const mfa = new URL("/commission/mfa", request.url);
  const authorize = new URL("/commission/authorize", request.url);
  const denied = new URL("/commission/denied", request.url);
  const dashboard = new URL("/commission/dashboard", request.url);

  if (!session) {
    if (decrypted) {
      const expired = NextResponse.redirect(login);
      expired.cookies.delete(SESSION_COOKIE);
      if (pathname === "/commission/login") {
        const allow = NextResponse.next();
        allow.cookies.delete(SESSION_COOKIE);
        return allow;
      }
      return expired;
    }
    if (
      pathname === "/commission/login" ||
      pathname === "/commission" ||
      pathname === "/commission/"
    ) {
      return NextResponse.next();
    }
    return NextResponse.redirect(login);
  }

  if (session.state === "authorized") {
    if (
      pathname === "/commission/login" ||
      pathname === "/commission/mfa" ||
      pathname === "/commission/authorize" ||
      pathname === "/commission" ||
      pathname === "/commission/"
    ) {
      return NextResponse.redirect(dashboard);
    }
    return NextResponse.next();
  }

  if (session.state === "pending_mfa") {
    if (pathname === "/commission/mfa" || pathname === "/commission/login") {
      return NextResponse.next();
    }
    return NextResponse.redirect(mfa);
  }

  if (session.state === "pending_authorization") {
    if (pathname === "/commission/authorize") return NextResponse.next();
    return NextResponse.redirect(authorize);
  }

  if (session.state === "denied") {
    if (
      pathname === "/commission/denied" ||
      pathname === "/commission/login" ||
      pathname === "/commission/authorize"
    ) {
      return NextResponse.next();
    }
    return NextResponse.redirect(denied);
  }

  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/commission/:path*"],
};
