export type AccessMode = "open" | "allowlist";

export function normalizeIp(value: string | null | undefined) {
  if (!value) return "";
  const first = value.split(",")[0]?.trim() ?? "";
  if (first.startsWith("::ffff:")) return first.slice(7);
  if (first === "::1") return "127.0.0.1";
  return first;
}

function ipv4ToInt(ip: string) {
  const parts = ip.split(".").map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return null;
  }
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

export function ipMatchesRule(ip: string, rule: string) {
  const candidate = normalizeIp(ip);
  const allowed = normalizeIp(rule);
  if (!candidate || !allowed) return false;
  if (allowed.includes("/")) {
    const [base, bitsRaw] = allowed.split("/");
    const bits = Number(bitsRaw);
    const address = ipv4ToInt(candidate);
    const network = ipv4ToInt(base);
    if (address === null || network === null || !Number.isInteger(bits) || bits < 0 || bits > 32) {
      return false;
    }
    const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
    return (address & mask) === (network & mask);
  }
  return candidate === allowed;
}

export function parseAllowlist(text: string) {
  return text
    .split(/[\n,]+/)
    .map((item) => normalizeIp(item))
    .filter(Boolean);
}

export function evaluateAccess(ip: string, mode: AccessMode, allowedIps: string[]) {
  const normalized = normalizeIp(ip);
  if (mode === "open") {
    return { allowed: true, reason: "Open access. Any workstation may reach the voting desks." };
  }
  if (!normalized) {
    return { allowed: false, reason: "Restricted mode is on, but this request has no readable IP." };
  }
  if (allowedIps.some((rule) => ipMatchesRule(normalized, rule))) {
    return { allowed: true, reason: "This workstation IP is on the Commission allow-list." };
  }
  return {
    allowed: false,
    reason: `IP ${normalized} is not an approved voting workstation.`,
  };
}
