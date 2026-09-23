"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ReauthModal } from "@/components/commission/SessionGuard";
import type { ActionResult } from "@/lib/actions/auth";

export function ActionButton({
  label,
  tone = "gold",
  disabled,
  disabledReason,
  run,
}: {
  label: string;
  tone?: "gold" | "navy" | "danger";
  disabled?: boolean;
  disabledReason?: string;
  run: () => Promise<ActionResult>;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [reauthOpen, setReauthOpen] = useState(false);

  async function execute() {
    setPending(true);
    setMessage(null);
    const result = await run();
    setPending(false);
    if (result.ok) {
      router.refresh();
      return;
    }
    if (result.needsReauth) {
      setReauthOpen(true);
      return;
    }
    setMessage(result.error);
  }

  const toneClass =
    tone === "navy"
      ? "bg-navy text-cream"
      : tone === "danger"
        ? "bg-red-800 text-white"
        : "bg-gold text-navy";

  return (
    <div>
      <button
        type="button"
        disabled={disabled || pending}
        title={disabled ? disabledReason : undefined}
        onClick={() => void execute()}
        className={`rounded-sm px-4 py-2 text-xs font-bold tracking-[0.16em] uppercase disabled:cursor-not-allowed disabled:opacity-40 ${toneClass}`}
      >
        {pending ? "Working…" : label}
      </button>
      {disabled && disabledReason ? (
        <p className="mt-2 max-w-xs text-xs leading-5 text-navy/50">{disabledReason}</p>
      ) : null}
      {message ? <p className="mt-2 text-xs text-red-700">{message}</p> : null}
      <ReauthModal
        open={reauthOpen}
        onClose={() => setReauthOpen(false)}
        onSuccess={() => {
          setReauthOpen(false);
          void execute();
        }}
      />
    </div>
  );
}
