import Link from "next/link";
import { RegisterWizard } from "@/components/agent/RegisterWizard";
import { DemoModeBanner } from "@/components/agent/StatusBadge";
import { publicStudentIdentity } from "@/lib/student-identity";
import { readStore } from "@/lib/store";

export const metadata = { title: "Agent registration" };
export const dynamic = "force-dynamic";

export default async function AgentRegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;
  const store = await readStore();
  const catalogues = {
    campuses: store.campuses,
    schools: store.schools,
    departments: store.departments,
  };
  const academicByStudent = Object.fromEntries(
    store.studentElectors.flatMap((student) => {
      const snapshot = publicStudentIdentity(student, catalogues);
      return [
        [student.studentId, snapshot],
        [student.studentId.toUpperCase(), snapshot],
      ];
    }),
  );
  const invitationsByStudent: Record<string, { reference: string; candidateName: string; candidatePosition: string; candidatePhoto: string; election: string }[]> = {};
  for (const invitation of store.agentInvitations) {
    const list = invitationsByStudent[invitation.invitedStudentId] ?? [];
    list.push({
      reference: invitation.reference,
      candidateName: invitation.candidateName,
      candidatePosition: invitation.candidatePosition,
      candidatePhoto: invitation.candidatePhoto,
      election: "Election 2 — SAKU Council Election",
    });
    invitationsByStudent[invitation.invitedStudentId] = list;
  }

  return (
    <main className="min-h-screen bg-[#f4f6fa] text-navy">
      <DemoModeBanner />
      <div className="mx-auto max-w-3xl px-4 py-10">
        <p className="text-[11px] tracking-[0.2em] text-navy/40 uppercase">ORBIS Election Agent Portal</p>
        <h1 className="mt-2 font-serif text-4xl">Agent registration</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-navy/65">
          Verify the shared student identity, then enter the invitation issued by the candidate. You will not be asked to pick a candidate yourself.
        </p>
        <div className="mt-6">
          <RegisterWizard
            stations={store.pollingStations.map((station) => ({
              id: station.id,
              name: station.name,
              campus: station.campus,
              campusId: station.campusId,
            }))}
            academicByStudent={academicByStudent}
            invitationsByStudent={invitationsByStudent}
            initialReference={ref}
          />
        </div>
        <p className="mt-6 text-sm">
          Already applied? <Link href="/agent/login" className="underline">Sign in</Link>
        </p>
      </div>
    </main>
  );
}
