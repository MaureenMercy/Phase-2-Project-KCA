"use client";

import Link from "next/link";
import { markPortalNotificationRead } from "@/lib/actions/candidate-portal";
import { formatDateTime } from "@/lib/format";
import type { PortalNotification } from "@/lib/types";

export function NotificationList({ items }: { items: PortalNotification[] }) {
  if (!items.length) {
    return <p className="candidate-card p-6 text-navy/70">You have no messages yet.</p>;
  }
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.id} className="candidate-card p-5">
          <p className="text-xs text-navy/50">{formatDateTime(item.createdAt)}</p>
          <h2 className="mt-1 font-semibold text-navy">{item.title}</h2>
          <p className="mt-2 text-sm text-navy/75">{item.body}</p>
          <div className="mt-3 flex gap-4 text-sm">
            <Link href={item.href} className="font-semibold text-navy underline-offset-4 hover:underline">
              Open
            </Link>
            {!item.read ? (
              <button
                type="button"
                className="text-navy/70 underline-offset-4 hover:underline"
                onClick={() => void markPortalNotificationRead(item.id)}
              >
                Mark as read
              </button>
            ) : (
              <span className="text-navy/40">Read</span>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
