import { CandidateShell } from "@/components/candidate/CandidateShell";
import { requireCandidateSession } from "@/lib/candidate-session";
import { identityByStudentId } from "@/lib/identity";
import { normalizeStudentId } from "@/lib/student-auth";
import { readStore } from "@/lib/store";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CandidatePortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireCandidateSession();
  const store = await readStore();
  const identity = identityByStudentId(store, session.studentId);
  if (!identity) redirect("/candidate/verify");
  const unreadCount = store.portalNotifications.filter(
    (item) =>
      normalizeStudentId(item.studentId) === normalizeStudentId(session.studentId) && !item.read,
  ).length;

  return (
    <CandidateShell
      studentName={identity.fullName}
      studentId={identity.studentId}
      unreadCount={unreadCount}
    >
      {children}
    </CandidateShell>
  );
}
