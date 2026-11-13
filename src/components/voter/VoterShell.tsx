"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { BrandMark } from "@/components/brand/BrandLogo";
import { KcaWatermark } from "@/components/brand/KcaWatermark";
import { DemoBanner } from "@/components/commission/DemoBanner";
import { voterPortalLogout } from "@/lib/actions/voter-portal";
import { initials } from "@/lib/format";
import type { VoterNotification } from "@/lib/types";
import { VOTER_NAV } from "@/lib/voter";

export function VoterShell({
  fullName,
  studentId,
  notifications,
  largeText,
  highContrast,
  children,
}: {
  fullName: string;
  studentId: string;
  notifications: VoterNotification[];
  largeText: boolean;
  highContrast: boolean;
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    document.documentElement.classList.toggle("voter-high-contrast", highContrast);
    document.documentElement.classList.toggle("voter-large-text", largeText);
    return () => {
      document.documentElement.classList.remove("voter-high-contrast", "voter-large-text");
    };
  }, [highContrast, largeText]);

  return (
    <div className="voter-portal min-h-screen bg-cream text-ink">
      <a
        href="#voter-main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-sm focus:bg-gold focus:px-3 focus:py-2 focus:text-navy"
      >
        Skip to main content
      </a>
      <header className="sticky top-0 z-40 border-b border-gold bg-navy text-cream">
        <div className="flex h-16 items-center gap-3 px-3 md:px-5">
          <button
            type="button"
            onClick={() => {
              if (window.matchMedia("(max-width: 1023px)").matches) setMobileOpen((value) => !value);
              else setSidebarOpen((value) => !value);
            }}
            className="flex h-11 w-11 items-center justify-center rounded-sm text-gold hover:bg-white/5"
            aria-label="Toggle navigation"
          >
            <span aria-hidden className="text-lg">☰</span>
          </button>
          <BrandMark className="hidden h-10 w-auto max-w-[148px] sm:block" />
          <p className="min-w-0 flex-1 truncate font-serif text-sm tracking-[0.18em] text-white uppercase md:text-base">
            ORBIS Voter Portal
          </p>
          <Link
            href="/voter/notifications"
            className="relative flex h-11 w-11 items-center justify-center rounded-sm text-gold hover:bg-white/5"
            aria-label="Notifications"
          >
            <span aria-hidden>🔔</span>
            {notifications.some((item) => !item.read) ? (
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-gold" />
            ) : null}
          </Link>
          <UserMenu fullName={fullName} studentId={studentId} />
        </div>
        <div className="border-t border-white/10 bg-navy-deep px-4 py-2 text-xs text-cream/80 md:px-6">
          voter.kca.ac.ke · Registration and account only · Not a remote ballot
        </div>
      </header>
      <div className="flex min-h-[calc(100vh-96px)]">
        {mobileOpen ? (
          <button
            type="button"
            className="fixed inset-0 z-30 bg-navy-deep/50 lg:hidden"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          />
        ) : null}
        <aside
          className={[
            "border-r border-navy/10 bg-white",
            "fixed inset-y-[96px] left-0 z-40 w-72 overflow-y-auto transition-transform lg:static lg:z-0 lg:h-auto",
            mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
            sidebarOpen ? "lg:w-72" : "lg:w-0 lg:overflow-hidden lg:border-0",
          ].join(" ")}
        >
          <nav className="px-3 py-5 pb-8" aria-label="Voter portal">
            {VOTER_NAV.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={[
                    "mb-1 flex min-h-11 items-start gap-3 rounded-xl px-3 py-2.5",
                    active ? "bg-navy text-cream" : "text-navy/80 hover:bg-cream",
                  ].join(" ")}
                  aria-current={active ? "page" : undefined}
                >
                  <span className="mt-0.5 w-6 text-center" aria-hidden>
                    {item.icon}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">{item.label}</span>
                    <span className={active ? "text-xs text-gold" : "text-xs text-navy/50"}>
                      {item.description}
                    </span>
                  </span>
                </Link>
              );
            })}
          </nav>
        </aside>
        <div className="relative min-w-0 flex-1">
          <KcaWatermark />
          <DemoBanner />
          <main id="voter-main" className="relative z-10 px-4 py-6 md:px-8 md:py-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

function UserMenu({ fullName, studentId }: { fullName: string; studentId: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const letter = useMemo(() => initials(fullName), [fullName]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex min-h-11 items-center gap-2 rounded-sm px-2 py-1.5 hover:bg-white/5"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="hidden text-right sm:block">
          <span className="block text-xs tracking-[0.14em] text-gold uppercase">Student</span>
          <span className="block max-w-[160px] truncate text-sm text-white">{fullName}</span>
        </span>
        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-gold bg-navy-mid font-serif text-sm text-gold">
          {letter}
        </span>
      </button>
      {open ? (
        <div className="absolute right-0 mt-2 w-64 rounded-sm border border-gold/20 bg-white p-4 text-ink shadow-xl">
          <p className="font-serif text-lg text-navy">{fullName}</p>
          <p className="font-mono text-xs text-navy/50">{studentId}</p>
          <button
            type="button"
            className="mt-4 w-full rounded-sm border border-navy/15 px-3 py-2 text-sm"
            onClick={async () => {
              await voterPortalLogout();
              router.push("/voter");
            }}
          >
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}
