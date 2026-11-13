import { PageHeader } from "@/components/commission/PageHeader";
import { formatDateTime } from "@/lib/format";
import { requireVoterContext } from "@/lib/voter-guard";
import { historyIsSafe } from "@/lib/voter";

export const dynamic = "force-dynamic";
export const metadata = { title: "My history" };

export default async function VoterHistoryPage() {
  const context = await requireVoterContext();
  const events = context.store.voterHistory.filter((item) => item.studentId === context.student.studentId);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="My History" title="Account and eligibility events">
        This list never includes ballot selections or candidate choices. Participation records and voting choices stay separate.
      </PageHeader>
      <ol className="space-y-3">
        {events.length === 0 ? (
          <li className="rounded-2xl border border-navy/10 bg-white p-6 text-sm text-navy/60">No history recorded yet.</li>
        ) : (
          events.map((event) => (
            <li key={event.id} className="rounded-2xl border border-navy/10 bg-white p-5">
              <p className="text-xs tracking-[0.16em] text-navy/40 uppercase">{formatDateTime(event.at)}</p>
              <h2 className="mt-1 font-serif text-xl text-navy">{event.title}</h2>
              <p className="mt-2 text-sm leading-6 text-navy/70">
                {historyIsSafe(event.detail)
                  ? event.detail
                  : "A participation change was recorded. Ballot choices are not stored here."}
              </p>
            </li>
          ))
        )}
      </ol>
    </div>
  );
}
