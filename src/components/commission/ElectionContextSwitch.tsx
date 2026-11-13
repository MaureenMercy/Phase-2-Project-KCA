"use client";

import { useRouter } from "next/navigation";
import { switchElectionContext } from "@/lib/actions/context";
import type { ElectionContext } from "@/lib/types";

const OPTIONS: { id: ElectionContext; label: string }[] = [
  { id: "ELECTION_1", label: "Election 1 — Delegates" },
  { id: "ELECTORAL_COLLEGE", label: "Electoral College" },
  { id: "ELECTION_2", label: "Election 2 — SAKU Council" },
];

export function ElectionContextSwitch({ current }: { current: ElectionContext }) {
  const router = useRouter();

  return (
    <div className="flex flex-wrap items-center gap-1">
      <span className="mr-2 tracking-[0.16em] text-gold/80 uppercase">Context</span>
      {OPTIONS.map((option) => (
        <button
          key={option.id}
          type="button"
          className={[
            "rounded-full px-3 py-1 text-[11px] font-semibold",
            current === option.id ? "bg-gold text-navy" : "bg-white/10 text-cream hover:bg-white/20",
          ].join(" ")}
          onClick={async () => {
            await switchElectionContext(option.id);
            router.refresh();
          }}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
