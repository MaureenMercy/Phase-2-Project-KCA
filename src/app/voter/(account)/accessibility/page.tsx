import { PageHeader } from "@/components/commission/PageHeader";
import { AccessibilityForm } from "@/components/voter/AccessibilityForm";
import { requireVoterContext } from "@/lib/voter-guard";
import { ACCESSIBILITY_COPY } from "@/lib/voter";

export const dynamic = "force-dynamic";
export const metadata = { title: "Accessibility & assistance" };

export default async function VoterAccessibilityPage() {
  const context = await requireVoterContext();
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Accessibility & Voting Assistance" title="Optional, confidential support">
        {ACCESSIBILITY_COPY}
      </PageHeader>
      <article className="rounded-2xl border border-navy/10 bg-white p-6">
        <p className="text-sm text-navy/65">
          These preferences do not affect registration approval. They are stored separately from ballot selections so the Election Day voting interface can retrieve them securely. You may update or withdraw them before Election Day.
        </p>
        <div className="mt-5">
          <AccessibilityForm initial={context.student.accessibility} />
        </div>
      </article>
    </div>
  );
}
