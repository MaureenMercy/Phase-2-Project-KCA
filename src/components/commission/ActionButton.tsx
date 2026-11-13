"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ReauthModal } from "@/components/commission/SessionGuard";
import type { ActionResult } from "@/lib/actions/auth";

type CommonProps = {
  label: string;
  tone?: "gold" | "navy" | "danger";
  disabled?: boolean;
  disabledReason?: string;
};

type ActionButtonProps<T> = CommonProps &
  ([T] extends [void]
    ? { run: () => Promise<ActionResult>; args?: undefined }
    : { run: (input: T) => Promise<ActionResult>; args: T });

export function ActionButton<T = void>(props: ActionButtonProps<T>) {
  const { label, tone = "gold", disabled, disabledReason, run, args } = props;
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [reauthOpen, setReauthOpen] = useState(false);

  async function execute() {
    setPending(true);
    setMessage(null);
    let result: ActionResult;
    try {
      result =
        args === undefined
          ? await (run as () => Promise<ActionResult>)()
          : await (run as (input: T) => Promise<ActionResult>)(args as T);
    } catch {
      setPending(false);
      setMessage("The request did not reach the server. Refresh the page and try again.");
      return;
    }
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
