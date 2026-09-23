import { PageHeader } from "@/components/commission/PageHeader";
import { NoticeForm } from "@/components/commission/NoticeForm";
import { formatDateTime } from "@/lib/format";
import { isAllowedNow } from "@/lib/permissions";
import { requireAuthorizedSession } from "@/lib/session";
import { readStore } from "@/lib/store";

export const metadata = { title: "Media & public information" };
export const dynamic = "force-dynamic";

export default async function MediaPage() {
  const session = await requireAuthorizedSession();
  const store = await readStore();
  const canPublish = isAllowedNow(session.role!, "manage_media", store.election.stage);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Commission-controlled broadcast" title="Media & public information">
        Public notices, voter education, and results publication are Commission
        functions. This is not an open social feed and does not display live
        vote percentages.
      </PageHeader>
      {canPublish ? <NoticeForm /> : <p className="text-sm text-navy/60">Your role can view notices but not publish them at this stage.</p>}
      <ul className="space-y-3">
        {store.notices.map((notice) => (
          <li key={notice.id} className="rounded-2xl border border-navy/10 bg-white/90 p-5">
            <p className="text-xs tracking-[0.16em] text-gold uppercase">{notice.audience}</p>
            <h2 className="font-serif text-2xl text-navy">{notice.title}</h2>
            <p className="mt-2 text-sm text-navy/70">{notice.body}</p>
            <p className="mt-2 text-xs text-navy/40">{notice.createdBy} · {formatDateTime(notice.createdAt)}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
