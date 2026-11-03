import Image from "next/image";

const LOGOS = {
  dark: "/brand/kca-university-logo.png",
  light: "/brand/kca-university-logo-light.png",
} as const;

export function BrandLogo({
  className = "h-24 w-auto",
  priority = false,
  /** `dark` = white/gold logo for navy panels; `light` = navy/gold logo for cream pages */
  surface = "dark",
}: {
  className?: string;
  priority?: boolean;
  surface?: keyof typeof LOGOS;
}) {
  return (
    <Image
      src={LOGOS[surface]}
      alt="KCA University"
      width={1232}
      height={720}
      priority={priority}
      className={`object-contain ${className}`}
    />
  );
}

/** Compact mark for navy top bars and tight chrome. */
export function BrandMark({
  className = "h-9 w-auto",
}: {
  className?: string;
}) {
  return (
    <Image
      src={LOGOS.dark}
      alt=""
      width={1232}
      height={720}
      className={`object-contain object-left ${className}`}
      aria-hidden="true"
    />
  );
}
