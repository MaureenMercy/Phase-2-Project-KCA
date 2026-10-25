import { describe, expect, it } from "vitest";
import { evaluateAccess, ipMatchesRule, normalizeIp, parseAllowlist } from "./ip";

describe("workstation IP policy", () => {
  it("normalizes IPv6-mapped and loopback addresses", () => {
    expect(normalizeIp("::ffff:192.168.1.20")).toBe("192.168.1.20");
    expect(normalizeIp("::1")).toBe("127.0.0.1");
    expect(normalizeIp("10.2.3.4, 10.2.3.5")).toBe("10.2.3.4");
  });

  it("matches exact IPs and CIDR ranges", () => {
    expect(ipMatchesRule("10.8.1.4", "10.8.1.4")).toBe(true);
    expect(ipMatchesRule("10.8.1.5", "10.8.1.4")).toBe(false);
    expect(ipMatchesRule("10.8.1.20", "10.8.1.0/24")).toBe(true);
    expect(ipMatchesRule("10.8.2.20", "10.8.1.0/24")).toBe(false);
  });

  it("parses allow-lists from commas or new lines", () => {
    expect(parseAllowlist("127.0.0.1, 10.0.0.0/24\n192.168.1.10")).toEqual([
      "127.0.0.1",
      "10.0.0.0/24",
      "192.168.1.10",
    ]);
  });

  it("allows every workstation in open mode and filters in restricted mode", () => {
    expect(evaluateAccess("8.8.8.8", "open", []).allowed).toBe(true);
    expect(evaluateAccess("8.8.8.8", "allowlist", ["127.0.0.1"]).allowed).toBe(false);
    expect(evaluateAccess("127.0.0.1", "allowlist", ["127.0.0.1"]).allowed).toBe(true);
    expect(evaluateAccess("", "allowlist", ["127.0.0.1"]).allowed).toBe(false);
  });
});
