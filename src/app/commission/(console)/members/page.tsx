import { PageHeader } from "@/components/commission/PageHeader";
import { memberDirectory } from "@/lib/format";
import { ROLE_LABELS, permissionsForRole } from "@/lib/permissions";
import { requireAuthorizedSession } from "@/lib/session";
import { readStore } from "@/lib/store";

export const metadata = { title: "Commission" };
export const dynamic = "force-dynamic";

export default async function MembersPage() {
  await requireAuthorizedSession();
  const store = await readStore();
  const members = memberDirectory();

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Authority" title="Electoral Commission">
        Seven members. The shell is the same; Work ID, role, assignment, and
        stage control the actions inside it. ICT staff are not listed here.
      </PageHeader>

      <div className="overflow-hidden rounded-2xl border border-navy/10 bg-white/90">
        <table className="w-full text-left text-sm">
          <thead className="bg-navy text-[11px] tracking-[0.14em] text-gold uppercase">
            <tr>
              <th className="px-4 py-3">Member</th>
              <th className="px-4 py-3">Work ID</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Station</th>
              <th className="px-4 py-3">Electoral powers</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => {
              const assignment = store.assignments.find((item) => item.memberId === member.id && item.active);
              const station = store.pollingStations.find((item) => item.id === assignment?.stationId);
              return (
                <tr key={member.id} className="border-t border-navy/10 align-top">
                  <td className="px-4 py-4 font-semibold text-navy">{member.fullName}</td>
                  <td className="px-4 py-4 font-mono text-xs">{member.workId}</td>
                  <td className="px-4 py-4">{ROLE_LABELS[member.role]}</td>
                  <td className="px-4 py-4">{station?.name ?? "Central administration"}</td>
                  <td className="px-4 py-4 text-xs leading-5 text-navy/65">
                    {permissionsForRole(member.role).length} permissions
                    {member.role === "CHAIR" ? ", including emergency initiation and results authorization" : ""}
                    {member.role === "VICE_CHAIR" ? ", including emergency co-authorization" : ""}
                    {member.role === "COMMISSIONER" ? " plus assigned station officer functions" : ""}.
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
