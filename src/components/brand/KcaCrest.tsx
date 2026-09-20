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
      <path
        d="M100 8 L188 42 V118 C188 176 148 214 100 228 C52 214 12 176 12 118 V42 Z"
        fill="#D0B216"
      />
      <path
        d="M100 18 L178 48 V116 C178 168 144 202 100 214 C56 202 22 168 22 116 V48 Z"
        fill="#182B5C"
      />
      <path
        d="M100 26 L170 52 V115 C170 162 140 193 100 204 C60 193 30 162 30 115 V52 Z"
        fill="none"
        stroke="#D0B216"
        strokeWidth="2.2"
      />
      <ellipse cx="100" cy="72" rx="10" ry="14" fill="#D0B216" />
      <path
        d="M100 58 C118 46 132 62 122 78 C114 70 106 68 100 78 C94 68 86 70 78 78 C68 62 82 46 100 58 Z"
        fill="#E8CC4A"
      />
      <path
        d="M100 84 L100 112"
        stroke="#D0B216"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="M58 148 C78 132 122 132 142 148 L142 168 C120 156 80 156 58 168 Z"
        fill="#F6F1DC"
      />
      <path
        d="M100 130 L100 172"
        stroke="#182B5C"
        strokeWidth="2.5"
      />
      <path
        d="M64 150 C82 140 100 140 100 140 L100 168 C100 168 80 160 64 166 Z"
        fill="#E8E2C8"
      />
      <path
        d="M136 150 C118 140 100 140 100 140 L100 168 C100 168 120 160 136 166 Z"
        fill="#F6F1DC"
      />
      <text
        x="100"
        y="198"
        textAnchor="middle"
        fill="#D0B216"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="22"
        fontWeight="700"
        letterSpacing="4"
      >
        KCA
      </text>
    </svg>
  );
}

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
        d="M22 44 C28 38 36 38 42 44 L42 50 C36 46 28 46 22 50 Z"
        fill="#F6F1DC"
      />
      <circle cx="32" cy="26" r="5" fill="#D0B216" />
    </svg>
  );
}
