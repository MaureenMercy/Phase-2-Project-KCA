export function portraitDataUri(name: string, seed = 210) {
  const initials = name
    .split(" ")
    .filter((part) => !["Prof.", "Dr.", "Ms.", "Mr.", "Eng."].includes(part))
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
  const hue = seed % 360;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160">
    <rect width="160" height="160" fill="hsl(${hue} 32% 28%)"/>
    <circle cx="80" cy="62" r="28" fill="hsl(${(hue + 40) % 360} 48% 72%)"/>
    <ellipse cx="80" cy="148" rx="48" ry="40" fill="hsl(${(hue + 40) % 360} 48% 72%)"/>
    <text x="80" y="150" text-anchor="middle" fill="#F6F1DC" font-size="18" font-family="Georgia, serif">${initials}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
