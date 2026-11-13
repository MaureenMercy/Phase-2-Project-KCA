import { NotificationList } from "@/components/candidate/NotificationList";
import { requireCandidateSession } from "@/lib/candidate-session";
import { normalizeStudentId } from "@/lib/student-auth";
import { readStore } from "@/lib/store";

export const metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const session = await requireCandidateSession();
  const store = await readStore();
  const items = store.portalNotifications.filter(
    (item) => normalizeStudentId(item.studentId) === normalizeStudentId(session.studentId),
  );

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-4xl text-navy">Notifications</h1>
      <NotificationList items={items} />
    </div>
  );
}
