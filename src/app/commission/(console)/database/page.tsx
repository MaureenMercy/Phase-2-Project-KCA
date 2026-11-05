import { PageHeader, StatCard } from "@/components/commission/PageHeader";
import { formatNumber } from "@/lib/format";
import { opsRecordsSummary } from "@/lib/ops-client";
import { requireAuthorizedSession } from "@/lib/session";
import { readStore } from "@/lib/store";

export const metadata = { title: "Database" };
export const dynamic = "force-dynamic";

function when(value: number | null) {
  if (!value) return "Not stored yet";
  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(new Date(value));
}

export default async function DatabasePage() {
  await requireAuthorizedSession();
  await readStore();
  const summary = await opsRecordsSummary();

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Stored records" title="Database">
        Commission accounts, one-time passwords, the student elector register, cabinet electors, and cast ballots are stored in MongoDB. Sign-in reads those records. Passwords stay hashed and are not shown here.
      </PageHeader>

      {!summary ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
          The operations database is not reachable. Keep the API running with npm run dev:stack, then refresh this page.
        </p>
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-4">
            <StatCard label="Engine" value="Mongo" hint={summary.storage} />
            <StatCard label="Commission accounts" value={formatNumber(summary.counts.commissionAccounts)} hint={`${summary.counts.memberships} memberships`} />
            <StatCard label="Student electors" value={formatNumber(summary.counts.studentElectors)} hint={summary.voterRegister ? `Register ${summary.voterRegister.version} · ${summary.voterRegister.status}` : "Voter register"} />
            <StatCard label="Stored ballots" value={formatNumber(summary.counts.storedBallots)} hint={`${summary.counts.delegateVotes} Election 1 · ${summary.counts.cabinetVotes} cabinet in the registry`} />
          </section>

          <p className="text-sm text-navy/60">
            Database <span className="font-semibold text-navy">{summary.database}</span>
            {" · "}registry saved {when(summary.registryUpdatedAt)}
            {" · "}
            {summary.counts.otpChallenges === 1
              ? "1 sign-in code waiting"
              : `${summary.counts.otpChallenges} sign-in codes waiting`}
            {" · "}{summary.counts.accessEvents} access events
            {" · "}{summary.counts.portraits} portraits
            {" · "}{summary.counts.auditEntries} audit entries
          </p>

          <section className="overflow-hidden rounded-2xl border border-navy/10 bg-white/90">
            <h2 className="border-b border-navy/10 px-5 py-4 font-serif text-2xl text-navy">Commission sign-in</h2>
            <table className="w-full text-left text-sm">
              <thead className="text-[11px] tracking-[0.14em] text-navy/45 uppercase">
                <tr>
                  <th className="px-5 py-2 font-semibold">Work ID</th>
                  <th className="px-5 py-2 font-semibold">Name</th>
                  <th className="px-5 py-2 font-semibold">Title</th>
                  <th className="px-5 py-2 font-semibold">Role</th>
                </tr>
              </thead>
              <tbody>
                {summary.accounts.map((account) => (
                  <tr key={account.workId} className="border-t border-navy/10">
                    <td className="px-5 py-3 font-semibold text-navy">{account.workId}</td>
                    <td className="px-5 py-3">{account.fullName}</td>
                    <td className="px-5 py-3">{account.title}</td>
                    <td className="px-5 py-3">{account.role?.replaceAll("_", " ") ?? account.accountKind}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="overflow-hidden rounded-2xl border border-navy/10 bg-white/90">
            <h2 className="border-b border-navy/10 px-5 py-4 font-serif text-2xl text-navy">Student electors and voters</h2>
            <table className="w-full text-left text-sm">
              <thead className="text-[11px] tracking-[0.14em] text-navy/45 uppercase">
                <tr>
                  <th className="px-5 py-2 font-semibold">Student ID</th>
                  <th className="px-5 py-2 font-semibold">Name</th>
                  <th className="px-5 py-2 font-semibold">Eligibility</th>
                  <th className="px-5 py-2 font-semibold">Ballot</th>
                </tr>
              </thead>
              <tbody>
                {summary.electors.map((student) => (
                  <tr key={student.studentId} className="border-t border-navy/10">
                    <td className="px-5 py-3 font-semibold text-navy">{student.studentId}</td>
                    <td className="px-5 py-3">{student.fullName}</td>
                    <td className="px-5 py-3">{student.eligibilityStatus}</td>
                    <td className="px-5 py-3">{student.voterStatus.replaceAll("_", " ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="overflow-hidden rounded-2xl border border-navy/10 bg-white/90">
            <h2 className="border-b border-navy/10 px-5 py-4 font-serif text-2xl text-navy">
              Cabinet electors ({summary.counts.collegeElectors})
            </h2>
            {summary.college.length === 0 ? (
              <p className="px-5 py-4 text-sm text-navy/65">
                The electoral college register is stored with the election registry. It fills after Election 1 results are finalized.
              </p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="text-[11px] tracking-[0.14em] text-navy/45 uppercase">
                  <tr>
                    <th className="px-5 py-2 font-semibold">Registration</th>
                    <th className="px-5 py-2 font-semibold">Name</th>
                    <th className="px-5 py-2 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.college.map((entry) => (
                    <tr key={entry.registrationNumber} className="border-t border-navy/10">
                      <td className="px-5 py-3 font-semibold text-navy">{entry.registrationNumber}</td>
                      <td className="px-5 py-3">{entry.fullName}</td>
                      <td className="px-5 py-3">{entry.electorStatus.replaceAll("_", " ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <section className="overflow-hidden rounded-2xl border border-navy/10 bg-white/90">
            <h2 className="border-b border-navy/10 px-5 py-4 font-serif text-2xl text-navy">Recent sign-in and access</h2>
            {summary.recentAccess.length === 0 ? (
              <p className="px-5 py-4 text-sm text-navy/65">No access events are stored yet.</p>
            ) : (
              <ul className="divide-y divide-navy/10 text-sm">
                {summary.recentAccess.map((event) => (
                  <li key={`${event.at}-${event.action}-${event.actor}`} className="flex flex-wrap justify-between gap-2 px-5 py-3">
                    <span>
                      <span className="font-semibold text-navy">{event.action.replaceAll("_", " ")}</span>
                      {" · "}
                      {event.actor || "unknown"}
                      {" · "}
                      {event.path}
                    </span>
                    <span className="text-navy/55">{event.allowed ? "allowed" : "denied"} · {event.at.slice(0, 19).replace("T", " ")}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
