import { PageHeader } from "@/components/commission/PageHeader";
import { ActionButton } from "@/components/commission/ActionButton";
import { markVoterNotificationsRead } from "@/lib/actions/voter-portal";
import { formatDateTime } from "@/lib/format";
import { requireVoterContext } from "@/lib/voter-guard";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = { title: "Notifications" };

export default async function VoterNotificationsPage() {
  const context = await requireVoterContext();
  const items = context.store.voterNotifications.filter((item) => item.studentId === context.student.studentId);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Notifications" title="Messages about your voter account">
        These notices never include ballot choices.
      </PageHeader>
      <ActionButton label="Mark all as read" run={markVoterNotificationsRead} />
      <ul className="space-y-3">
        {items.length === 0 ? (
          <li className="rounded-2xl border border-navy/10 bg-white p-6 text-sm text-navy/60">No notifications yet.</li>
        ) : (
          items.map((item) => (
            <li key={item.id} className="rounded-2xl border border-navy/10 bg-white p-5">
              <p className="text-xs text-navy/40">{formatDateTime(item.createdAt)} {item.read ? "" : "· Unread"}</p>
              <h2 className="mt-1 font-serif text-xl text-navy">{item.title}</h2>
              <p className="mt-2 text-sm text-navy/70">{item.body}</p>
              <Link href={item.href} className="mt-3 inline-block text-sm text-navy underline">
                Open
              </Link>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
