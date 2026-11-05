"use client";

import { useEffect, useState } from "react";
import { logoutAction, reauthenticate } from "@/lib/actions/auth";
import { SESSION_IDLE_MS } from "@/lib/session-limits";

const WARN_MS = 2 * 60 * 1000;

export function SessionGuard() {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    let last = Date.now();
    let lastPing = 0;
    let stopped = false;

    function bump() {
      last = Date.now();
      setRemaining(null);
    }

    const events = ["click", "keydown", "mousemove", "scroll", "touchstart"];
    events.forEach((event) => window.addEventListener(event, bump));

    async function leave() {
      if (stopped) return;
      stopped = true;
      window.clearInterval(timer);
      events.forEach((event) => window.removeEventListener(event, bump));
      try {
        await logoutAction();
      } catch {
        // A second tab may already have ended the session.
      }
      window.location.assign("/commission/login?reason=timeout");
    }

    void fetch("/api/session/ping", { method: "POST" }).then((response) => {
      if (response.status === 401) void leave();
    });
    lastPing = Date.now();

    const timer = window.setInterval(async () => {
      if (stopped) return;
      const idle = Date.now() - last;
      const left = SESSION_IDLE_MS - idle;
      if (left <= 0) {
        await leave();
        return;
      }
      if (left <= WARN_MS) setRemaining(Math.ceil(left / 1000));
      if (Date.now() - lastPing > 60_000 && idle < SESSION_IDLE_MS) {
        lastPing = Date.now();
        try {
          const response = await fetch("/api/session/ping", { method: "POST" });
          if (response.status === 401) await leave();
        } catch {
          // A missed ping does not end the session. The idle timer still does.
        }
      }
    }, 1000);

    return () => {
      stopped = true;
      events.forEach((event) => window.removeEventListener(event, bump));
      window.clearInterval(timer);
    };
  }, []);

  if (remaining === null) return null;

  return (
    <div className="fixed right-4 bottom-4 z-50 max-w-sm rounded-sm border border-gold bg-navy px-4 py-3 text-cream shadow-xl">
      <p className="text-sm font-semibold">Session timeout</p>
      <p className="mt-1 text-xs text-cream/70">
        You will be signed out in {remaining}s due to inactivity. Interact with
        the page to stay signed in.
      </p>
    </div>
  );
}

export function ReauthModal({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-deep/60 px-4">
      <form
        className="w-full max-w-md rounded-sm border border-gold/30 bg-white p-6"
        onSubmit={async (event) => {
          event.preventDefault();
          setPending(true);
          setError(null);
          const result = await reauthenticate(password);
          setPending(false);
          if (!result.ok) {
            setError(result.error);
            return;
          }
          setPassword("");
          onSuccess();
        }}
      >
        <p className="font-serif text-2xl text-navy">Re-authenticate</p>
        <p className="mt-2 text-sm text-navy/70">
          This is a high-risk electoral action. Confirm your institutional
          password to continue. Authentication still does not expand your role.
        </p>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-4 w-full rounded-sm border border-navy/20 px-3 py-2"
          autoFocus
        />
        {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm">
            Cancel
          </button>
          <button
            type="submit"
            disabled={pending}
            className="rounded-sm bg-gold px-4 py-2 text-sm font-bold tracking-wide text-navy uppercase"
          >
            Confirm
          </button>
        </div>
      </form>
    </div>
  );
}
