"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { DemoBanner } from "@/components/candidate/DemoBanner";
import { logoutCandidate } from "@/lib/actions/candidate-portal";

const NAV = [
  { href: "/candidate/dashboard", label: "Home / Dashboard" },
  { href: "/candidate/applications", label: "My Applications" },
  { href: "/candidate/apply", label: "Apply to Contest" },
  { href: "/candidate/agents", label: "My Agent Nominations" },
  { href: "/candidate/notifications", label: "Notifications" },
  { href: "/candidate/profile", label: "My Profile" },
  { href: "/candidate/support", label: "Help & Support" },
];

export function CandidateShell({
  studentName,
  studentId,
  unreadCount,
  children,
}: {
  studentName: string;
  studentId: string;
  unreadCount: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="candidate-portal min-h-screen">
      <a
        href="#candidate-main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      <DemoBanner />
      <header className="border-b border-navy/10 bg-navy text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/candidate/dashboard" className="flex items-center gap-3">
            <BrandLogo className="h-12 w-auto" surface="dark" />
            <span>
              <span className="block text-[11px] tracking-[0.22em] text-gold uppercase">
                ORBIS
              </span>
              <span className="block font-serif text-xl leading-none">Candidate Portal</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <p className="hidden text-right text-sm sm:block">
              <span className="block font-semibold">{studentName}</span>
              <span className="block text-white/70">{studentId}</span>
            </p>
            <form action={logoutCandidate}>
              <button
                type="submit"
                className="rounded-md border border-white/25 px-3 py-2 text-xs font-semibold tracking-[0.14em] uppercase hover:bg-white/10"
              >
                Sign out
              </button>
            </form>
            <button
              type="button"
              className="rounded-md border border-white/25 px-3 py-2 text-xs font-semibold tracking-[0.14em] uppercase lg:hidden"
              aria-expanded={open}
              aria-controls="candidate-nav"
              onClick={() => setOpen((value) => !value)}
            >
              Menu
            </button>
          </div>
        </div>
      </header>
      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-6">
        <nav
          id="candidate-nav"
          aria-label="Candidate portal"
          className={`${open ? "block" : "hidden"} w-full shrink-0 lg:block lg:w-60`}
        >
          <ul className="space-y-1">
            {NAV.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/candidate/dashboard" && pathname.startsWith(item.href));
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium ${
                      active ? "bg-navy text-white" : "text-navy hover:bg-white"
                    }`}
                  >
                    <span>{item.label}</span>
                    {item.href === "/candidate/notifications" && unreadCount > 0 ? (
                      <span className="rounded-full bg-gold px-2 py-0.5 text-[11px] font-bold text-navy">
                        {unreadCount}
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <main id="candidate-main" className="min-w-0 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
