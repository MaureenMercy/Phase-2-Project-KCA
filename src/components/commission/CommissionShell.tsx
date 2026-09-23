"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { KcaMark } from "@/components/brand/KcaCrest";
import { KcaWatermark } from "@/components/brand/KcaWatermark";
import { logoutAction, logoutAndForgetDevice } from "@/lib/actions/auth";
import { navForPermissions } from "@/lib/nav";
import { CONTEST_LABELS, ROLE_LABELS, STAGE_LABELS } from "@/lib/permissions";
import type {
  CommissionRole,
  ElectionContest,
  ElectionStage,
  ElectoralPermission,
  NotificationItem,
} from "@/lib/types";
import { initials } from "@/lib/format";

export type ShellUser = {
  fullName: string;
  shortName: string;
  workId: string;
  role: CommissionRole;
  stationNames: string[];
};

export function CommissionShell({
  user,
  electionName,
  stage,
  contest,
  emergencyPaused,
  permissions,
  notifications,
  children,
}: {
  user: ShellUser;
  electionName: string;
  stage: ElectionStage;
  contest: ElectionContest;
  emergencyPaused: boolean;
  permissions: ElectoralPermission[];
  notifications: NotificationItem[];
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const items = navForPermissions(permissions);

  return (
    <div className="min-h-screen bg-cream text-ink">
      <TopBar
        user={user}
        notifications={notifications}
        electionName={electionName}
        contest={contest}
        stage={stage}
        emergencyPaused={emergencyPaused}
        onMenu={() => {
          if (window.matchMedia("(max-width: 1023px)").matches) {
            setMobileOpen((value) => !value);
          } else {
            setSidebarOpen((value) => !value);
          }
        }}
      />
      <div className="flex min-h-[calc(100vh-96px)]">
        <Sidebar
          open={sidebarOpen}
          mobileOpen={mobileOpen}
          onClose={() => setMobileOpen(false)}
          pathname={pathname}
          items={items}
        />
        <div className="relative min-w-0 flex-1">
          <KcaWatermark />
          <MobileAdminNotice />
          <main className="relative z-10 px-4 py-6 md:px-8 md:py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}

function TopBar({
  user,
  notifications,
  electionName,
  contest,
  stage,
  emergencyPaused,
  onMenu,
}: {
  user: ShellUser;
  notifications: NotificationItem[];
  electionName: string;
  contest: ElectionContest;
  stage: ElectionStage;
  emergencyPaused: boolean;
  onMenu: () => void;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-gold bg-navy text-cream">
      <div className="flex h-16 items-center gap-3 px-3 md:px-5">
        <button
          type="button"
          onClick={onMenu}
          className="flex h-10 w-10 items-center justify-center rounded-sm text-gold hover:bg-white/5"
          aria-label="Toggle navigation"
        >
          <MenuIcon />
        </button>
        <KcaMark className="hidden h-8 w-8 sm:block" />
        <p className="min-w-0 flex-1 truncate font-serif text-sm tracking-[0.22em] text-white uppercase md:text-base">
          SAKU Election System
        </p>
        <NotificationBell notifications={notifications} />
        <UserMenu user={user} />
      </div>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-1 border-t border-white/10 bg-navy-deep px-4 py-2 text-xs md:px-6">
        <p>
          <span className="tracking-[0.16em] text-gold/80 uppercase">Election</span>{" "}
          <span className="text-cream">{electionName}</span>
        </p>
        <p>
          <span className="tracking-[0.16em] text-gold/80 uppercase">Stage</span>{" "}
          <span className="text-cream">{CONTEST_LABELS[contest]}</span>
          <span className="text-cream/50"> · {STAGE_LABELS[stage]}</span>
        </p>
        {emergencyPaused ? (
          <span className="rounded-full bg-red-700 px-2 py-0.5 text-[10px] font-bold tracking-wider text-white uppercase">
            Election paused
          </span>
        ) : null}
      </div>
    </header>
  );
}

function Sidebar({
  open,
  mobileOpen,
  onClose,
  pathname,
  items,
}: {
  open: boolean;
  mobileOpen: boolean;
  onClose: () => void;
  pathname: string;
  items: ReturnType<typeof navForPermissions>;
}) {
  const standard = items.filter((item) => item.kind !== "restricted");
  const restricted = items.filter((item) => item.kind === "restricted");

  return (
    <>
      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-navy-deep/50 lg:hidden"
          aria-label="Close menu"
          onClick={onClose}
        />
      ) : null}
      <aside
        className={[
          "border-r border-navy/10 bg-white",
          "fixed inset-y-[96px] left-0 z-40 w-72 overflow-y-auto transition-transform lg:static lg:z-0 lg:h-auto",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          open ? "lg:w-72" : "lg:w-0 lg:overflow-hidden lg:border-0",
        ].join(" ")}
      >
        <nav className="px-3 py-5 pb-8">
          {standard.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={[
                  "mb-1 flex items-start gap-3 rounded-xl px-3 py-2.5",
                  active ? "bg-navy text-cream" : "text-navy/80 hover:bg-cream",
                ].join(" ")}
              >
                <span className="mt-0.5 w-6 text-center text-base" aria-hidden>
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
          {restricted.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={[
                  "mt-6 flex items-start gap-3 rounded-xl border px-3 py-2.5",
                  active
                    ? "border-red-800 bg-red-800 text-white"
                    : "border-red-200 bg-red-50 text-red-900 hover:bg-red-100",
                ].join(" ")}
              >
                <span className="mt-0.5 w-6 text-center text-base" aria-hidden>
                  {item.icon}
                </span>
                <span>
                  <span className="block text-sm font-semibold">{item.label}</span>
                  <span className="text-xs opacity-80">{item.description}</span>
                </span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}

function UserMenu({ user }: { user: ShellUser }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const letter = useMemo(() => initials(user.fullName), [user.fullName]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2 rounded-sm px-2 py-1.5 hover:bg-white/5"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="hidden text-right sm:block">
          <span className="block text-xs tracking-[0.14em] text-gold uppercase">
            EC User
          </span>
          <span className="block max-w-[160px] truncate text-sm text-white">
            {user.shortName}
          </span>
        </span>
        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-gold bg-navy-mid font-serif text-sm text-gold">
          {letter}
        </span>
        <Chevron />
      </button>
      {open ? (
        <div className="absolute right-0 mt-2 w-72 rounded-sm border border-gold/20 bg-white p-4 text-ink shadow-xl">
          <p className="font-serif text-lg text-navy">{user.fullName}</p>
          <p className="text-sm text-navy/70">{ROLE_LABELS[user.role]}</p>
          <p className="mt-1 font-mono text-xs text-navy/50">{user.workId}</p>
          <p className="mt-3 text-xs leading-5 text-navy/60">
            Station assignment: {user.stationNames.join(", ") || "Central commission administration"}
          </p>
          <div className="mt-4 flex flex-col gap-2">
            <button
              type="button"
              className="rounded-sm border border-navy/15 px-3 py-2 text-sm"
              onClick={async () => {
                await logoutAction();
                router.push("/commission/login");
              }}
            >
              Sign out
            </button>
            <button
              type="button"
              className="rounded-sm px-3 py-2 text-sm text-navy/60"
              onClick={async () => {
                await logoutAndForgetDevice();
                router.push("/commission/login");
              }}
            >
              Sign out and forget this workstation
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function NotificationBell({ notifications }: { notifications: NotificationItem[] }) {
  const [open, setOpen] = useState(false);
  const unread = notifications.filter((item) => !item.read).length;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative flex h-10 w-10 items-center justify-center rounded-sm text-gold hover:bg-white/5"
        aria-label="Notifications"
      >
        <BellIcon />
        {unread > 0 ? (
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-gold" />
        ) : null}
      </button>
      {open ? (
        <div className="absolute right-0 mt-2 w-80 rounded-sm border border-gold/20 bg-white text-ink shadow-xl">
          <p className="border-b border-navy/10 px-4 py-3 text-xs tracking-[0.18em] text-navy/50 uppercase">
            Notifications
          </p>
          <ul className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <li className="px-4 py-6 text-sm text-navy/50">No notices.</li>
            ) : (
              notifications.map((item) => (
                <li key={item.id} className="border-b border-navy/5 px-4 py-3">
                  <Link href={item.href} className="block hover:text-navy">
                    <span className="text-sm font-semibold text-navy">{item.title}</span>
                    <span className="mt-1 block text-xs leading-5 text-navy/60">
                      {item.body}
                    </span>
                  </Link>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function MobileAdminNotice() {
  return (
    <p className="relative z-10 border-b border-gold/30 bg-navy px-4 py-2 text-center text-[11px] tracking-wide text-cream/80 lg:hidden">
      Desktop remains the primary Commission experience. On a phone, only incident
      evidence upload is supported.
    </p>
  );
}

function MenuIcon() {
  return (
    <svg width="22" height="16" viewBox="0 0 22 16" fill="none" aria-hidden="true">
      <path d="M1 1.5h20M1 8h20M1 14.5h20" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="20" height="22" viewBox="0 0 20 22" fill="none" aria-hidden="true">
      <path
        d="M10 2a6 6 0 0 0-6 6v3.2L2 14h16l-2-2.8V8a6 6 0 0 0-6-6Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path d="M7.5 16.5a2.5 2.5 0 0 0 5 0" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function Chevron() {
  return (
    <svg width="12" height="8" viewBox="0 0 12 8" fill="none" aria-hidden="true" className="text-gold">
      <path d="M1 1.5 6 6.5 11 1.5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
