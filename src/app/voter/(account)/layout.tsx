import { VoterShell } from "@/components/voter/VoterShell";
import { requireVoterContext } from "@/lib/voter-guard";

export const dynamic = "force-dynamic";

export default async function VoterAccountLayout({ children }: { children: React.ReactNode }) {
  const context = await requireVoterContext();
  const notifications = context.store.voterNotifications.filter((item) => item.studentId === context.student.studentId);
  const accommodations = context.student.accessibility.accommodations.map((item) => item.toLowerCase());
  return (
    <VoterShell
      fullName={context.student.fullName}
      studentId={context.student.studentId}
      notifications={notifications}
      largeText={accommodations.some((item) => item.includes("larger") || item === "larger-text")}
      highContrast={accommodations.some((item) => item.includes("high-contrast") || item === "high-contrast")}
    >
      {children}
    </VoterShell>
  );
}
