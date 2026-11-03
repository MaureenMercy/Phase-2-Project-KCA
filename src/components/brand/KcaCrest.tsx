export function KcaCrest({
  className = "h-28 w-auto",
  title = "KCA University",
}: {
  className?: string;
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 200 236"
      className={className}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      {/* Outer gold rim */}
      <path
        d="M100 6 L186 38 V112 C186 172 146 212 100 228 C54 212 14 172 14 112 V38 Z"
        fill="#D0B216"
      />
      {/* Navy field */}
      <path
        d="M100 14 L176 42 V112 C176 166 142 202 100 216 C58 202 24 166 24 112 V42 Z"
        fill="#182B5C"
      />
      {/* Inner gold stroke */}
      <path
        d="M100 22 L168 48 V112 C168 160 140 192 100 204 C60 192 32 160 32 112 V48 Z"
        fill="none"
        stroke="#D0B216"
        strokeWidth="2"
      />

      {/* Fleur / three-leaf motif */}
      <g fill="#D0B216" transform="translate(100 74)">
        <ellipse cx="0" cy="-2" rx="7" ry="12" />
        <path d="M0 -10 C16 -22 26 -6 16 10 C8 2 4 0 0 10 C-4 0 -8 2 -16 10 C-26 -6 -16 -22 0 -10 Z" fill="#E8CC4A" />
        <path d="M0 8 L0 28" stroke="#D0B216" strokeWidth="3.2" strokeLinecap="round" fill="none" />
        <path d="M-10 18 Q0 12 10 18" stroke="#D0B216" strokeWidth="2" fill="none" strokeLinecap="round" />
      </g>

      {/* Open book */}
      <g transform="translate(100 150)">
        <path d="M-42 4 C-22 -12 22 -12 42 4 L42 22 C20 10 -20 10 -42 22 Z" fill="#F6F1DC" />
        <path d="M-36 6 C-18 -4 0 -4 0 -4 L0 20 C0 20 -18 14 -36 20 Z" fill="#EDE6CF" />
        <path d="M36 6 C18 -4 0 -4 0 -4 L0 20 C0 20 18 14 36 20 Z" fill="#F6F1DC" />
        <path d="M0 -8 L0 24" stroke="#182B5C" strokeWidth="2.4" />
        <path d="M-28 2 L-10 2 M-26 8 L-12 8 M28 2 L10 2 M26 8 L12 8" stroke="#182B5C" strokeWidth="1.2" opacity="0.35" />
      </g>

      {/* Arched KCA along the shield base */}
      <defs>
        <path id="kca-arc" d="M52 188 Q100 208 148 188" fill="none" />
      </defs>
      <text
        fill="#D0B216"
        fontFamily="Georgia, 'Times New Roman', Times, serif"
        fontSize="20"
        fontWeight="700"
        letterSpacing="6"
      >
        <textPath href="#kca-arc" startOffset="50%" textAnchor="middle">
          KCA
        </textPath>
      </text>
    </svg>
  );
}

/** Compact shield mark for sidebars and tight chrome. */
export function KcaMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 72" className={className} aria-hidden="true">
      <path
        d="M32 2 L60 14 V36 C60 54 46 64 32 70 C18 64 4 54 4 36 V14 Z"
        fill="#D0B216"
      />
      <path
        d="M32 7 L55 17 V36 C55 51 43 60 32 65 C21 60 9 51 9 36 V17 Z"
        fill="#182B5C"
      />
      <path
        d="M32 20 C38 14 44 20 40 28 C36 24 34 24 32 28 C30 24 28 24 24 28 C20 20 26 14 32 20 Z"
        fill="#E8CC4A"
      />
      <path
        d="M22 44 C28 38 36 38 42 44 L42 50 C36 46 28 46 22 50 Z"
        fill="#F6F1DC"
      />
      <path d="M32 38 L32 52" stroke="#182B5C" strokeWidth="1.6" />
    </svg>
  );
}

/**
 * Official-style KCA University wordmark (sun + KCA monogram + UNIVERSITY + 1989).
 * Use `tone="light"` on dark navy panels; `tone="dark"` on white/cream.
 */
export function KcaUniversityLogo({
  className = "h-20 w-auto",
  tone = "light",
  title = "KCA University",
}: {
  className?: string;
  tone?: "light" | "dark";
  title?: string;
}) {
  const ink = tone === "dark" ? "#182B5C" : "#FFFFFF";
  const gold = "#C9A227";
  const serif = "Georgia, 'Times New Roman', Times, serif";

  // Triangular rays fanning upward from the sun disc
  const rayAngles = [-78, -52, -28, 0, 28, 52, 78];
  const rays = rayAngles.map((deg) => {
    const rad = (deg * Math.PI) / 180;
    const inner = 9;
    const outer = deg === 0 ? 30 : 26;
    const tipX = Math.sin(rad) * outer;
    const tipY = 18 - Math.cos(rad) * outer;
    const left = rad - 0.14;
    const right = rad + 0.14;
    const bx1 = Math.sin(left) * inner;
    const by1 = 18 - Math.cos(left) * inner;
    const bx2 = Math.sin(right) * inner;
    const by2 = 18 - Math.cos(right) * inner;
    return `${bx1},${by1} ${tipX},${tipY} ${bx2},${by2}`;
  });

  return (
    <svg
      viewBox="0 0 280 178"
      className={className}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>

      {/* Rising sun with flat base resting on a gold rule */}
      <g fill={gold} transform="translate(140 8)">
        {rays.map((points, i) => (
          <polygon key={i} points={points} />
        ))}
        <path d="M-18 18 A18 18 0 0 1 18 18 Z" />
        <rect x="-34" y="18" width="68" height="1.6" />
      </g>

      {/* Gold C behind white/navy K and A */}
      <text
        x="140"
        y="104"
        textAnchor="middle"
        fill={gold}
        fontFamily={serif}
        fontSize="86"
        fontWeight="700"
      >
        C
      </text>
      <text
        x="78"
        y="102"
        textAnchor="middle"
        fill={ink}
        fontFamily={serif}
        fontSize="76"
        fontWeight="700"
      >
        K
      </text>
      <text
        x="202"
        y="102"
        textAnchor="middle"
        fill={ink}
        fontFamily={serif}
        fontSize="76"
        fontWeight="700"
      >
        A
      </text>

      <line x1="48" y1="118" x2="232" y2="118" stroke={gold} strokeWidth="1.4" />
      <text
        x="140"
        y="138"
        textAnchor="middle"
        fill={ink}
        fontFamily={serif}
        fontSize="15"
        fontWeight="600"
        letterSpacing="7"
      >
        UNIVERSITY
      </text>
      <line x1="48" y1="146" x2="232" y2="146" stroke={gold} strokeWidth="1.4" />
      <text
        x="140"
        y="166"
        textAnchor="middle"
        fill={ink}
        fontFamily={serif}
        fontSize="12"
        letterSpacing="5"
      >
        ~ 1 9 8 9 ~
      </text>
    </svg>
  );
}
