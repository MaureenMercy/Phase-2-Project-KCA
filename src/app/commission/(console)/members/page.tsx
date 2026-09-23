import { memberDirectory } from "@/lib/format";
import { ROLE_LABELS, permissionsForRole } from "@/lib/permissions";
import { requireAuthorizedSession } from "@/lib/session";

export const metadata = { title: "Commission" };
export const dynamic = "force-dynamic";

export default async function MembersPage() {
  await requireAuthorizedSession();
  const members = memberDirectory();

  return (
    <div className="space-y-6">
      <header>
        <p className="text-[11px] tracking-[0.22em] text-navy/40 uppercase">Authority</p>
        <h1 className="font-serif text-4xl text-navy">Electoral Commission</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-navy/65">
          Seven members sit at this commission level. Role, not login success,
          determines what each person may do. ICT staff are not listed here.
        </p>
      </header>

      <div className="overflow-hidden rounded-sm border border-navy/10 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-navy text-[11px] tracking-[0.14em] text-gold uppercase">
            <tr>
              <th className="px-4 py-3">Member</th>
              <th className="px-4 py-3">Work ID</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Electoral powers</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.id} className="border-t border-navy/10 align-top">
                <td className="px-4 py-4 font-semibold text-navy">{member.fullName}</td>
                <td className="px-4 py-4 font-mono text-xs">{member.workId}</td>
                <td className="px-4 py-4">{ROLE_LABELS[member.role]}</td>
                <td className="px-4 py-4 text-xs leading-5 text-navy/65">
                  {permissionsForRole(member.role).length} permissions including
                  {member.role === "CHAIR" ? " special results authorization" : " no results authorization"}
                  .
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
