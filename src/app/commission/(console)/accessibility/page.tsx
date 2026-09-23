import { PageHeader } from "@/components/commission/PageHeader";
import { requireAuthorizedSession } from "@/lib/session";

export const metadata = { title: "Accessibility" };
export const dynamic = "force-dynamic";

export default async function AccessibilityPage() {
  await requireAuthorizedSession();
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Access" title="Accessibility">
        The Commission shell keeps high-contrast navy and gold, large controls,
        and a decorative watermark that never captures pointer events or prints
        over official reports.
      </PageHeader>
      <section className="rounded-2xl border border-navy/10 bg-white/90 p-6 text-sm leading-6 text-navy/70">
        <ul className="list-disc space-y-2 pl-5">
          <li>Desktop remains the primary administrative experience.</li>
          <li>Phone access is limited to incident evidence upload.</li>
          <li>High-risk actions require re-authentication.</li>
          <li>Watermark opacity is 7% and sits behind content.</li>
        </ul>
      </section>
    </div>
  );
}
