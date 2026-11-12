"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { logoutAgentPortal } from "@/lib/actions/agent-portal";
import { agentCan } from "@/lib/agent-access";
import { AGENT_NAV } from "@/lib/agent-nav";
import { BrandMark } from "@/components/brand/BrandLogo";
import { DemoModeBanner, StatusBadge } from "@/components/agent/StatusBadge";
import type { AgentRecord } from "@/lib/types";

export function AgentShell({
  agent,
  unreadCount,
  children,
}: {
  agent: AgentRecord;
  unreadCount: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f4f6fa] text-navy">
      <DemoModeBanner />
      <header className="border-b border-navy/10 bg-navy text-cream">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-lg px-2 py-1 text-gold lg:hidden focus-visible:outline-2 focus-visible:outline-gold"
              aria-label="Open navigation"
              onClick={() => setOpen((value) => !value)}
            >
              Menu
            </button>
            <BrandMark className="h-9 w-auto" />
            <div>
              <p className="text-[10px] tracking-[0.22em] text-gold uppercase">ORBIS · Election Agent Portal</p>
              <p className="font-serif text-lg leading-none">{agent.fullName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <StatusBadge status={agent.accreditationStatus} />
            <form
              action={async () => {
                await logoutAgentPortal();
                router.push("/agent");
                router.refresh();
              }}
            >
              <button
                type="submit"
                className="rounded-lg border border-gold/40 px-3 py-1.5 tracking-[0.14em] text-gold uppercase focus-visible:outline-2 focus-visible:outline-gold"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-6">
        <aside
          className={[
            "z-20 w-72 shrink-0 rounded-2xl border border-navy/10 bg-white p-4 lg:sticky lg:top-4 lg:block lg:h-fit",
            open ? "fixed inset-x-4 top-24 block" : "hidden",
          ].join(" ")}
        >
          <nav aria-label="Agent portal">
            {AGENT_NAV.map((group) => (
              <div key={group.id} className="mb-4">
                <p className="px-2 text-[10px] font-semibold tracking-[0.18em] text-navy/40 uppercase">
                  {group.label}
                </p>
                <ul className="mt-2 space-y-1">
                  {group.items.map((item) => {
                    const allowed = agentCan(agent, item.capability);
                    const active = pathname === item.href;
                    const badge = item.href === "/agent/notifications" && unreadCount > 0 ? unreadCount : null;
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={() => setOpen(false)}
                          aria-current={active ? "page" : undefined}
                          className={[
                            "flex items-center justify-between rounded-xl px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold",
                            active ? "bg-navy text-cream" : allowed ? "text-navy hover:bg-slate-50" : "text-navy/35",
                          ].join(" ")}
                        >
                          <span>{item.label}</span>
                          {badge ? (
                            <span className="rounded-full bg-gold px-1.5 text-[10px] font-bold text-navy">{badge}</span>
                          ) : null}
                          {!allowed ? <span className="text-[10px] tracking-wide uppercase">Locked</span> : null}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </aside>
        <main className="min-w-0 flex-1 space-y-6 pb-16">{children}</main>
      </div>
    </div>
  );
}

export function LockedNotice({ title, message }: { title: string; message: string }) {
  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-950">
      <h2 className="font-serif text-2xl">{title}</h2>
      <p className="mt-2 text-sm leading-6">{message}</p>
      <p className="mt-3 text-sm">
        You can still view your application, candidate association, accreditation status and notifications.
      </p>
    </section>
  );
}
