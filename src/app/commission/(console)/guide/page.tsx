import Link from "next/link";
import { PageHeader } from "@/components/commission/PageHeader";
import { requireAuthorizedSession } from "@/lib/session";

export const metadata = { title: "How to run this election" };
export const dynamic = "force-dynamic";

export default async function GuidePage() {
  await requireAuthorizedSession();

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Operations guide" title="From login to opening Election 1">
        Use this if you are demonstrating the prototype as Commission Chair
        (Prof. Amina Wanjiku). Saving the election date is not the same as
        configuring delegate seats.
      </PageHeader>

      <section className="rounded-2xl border border-navy/10 bg-white/90 p-6 text-sm leading-6 text-navy/75">
        <h2 className="font-serif text-2xl text-navy">Sign in</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5">
          <li>Open Commission Login.</li>
          <li>
            Work ID <code className="rounded bg-cream px-1">KCAU-EC-001</code>, password{" "}
            <code className="rounded bg-cream px-1">KCAU@2026</code>.
          </li>
          <li>
            OTP on the hosted demo is always <code className="rounded bg-cream px-1">202026</code>.
          </li>
          <li>Complete the permission check, then you should land on the dashboard.</li>
        </ol>
      </section>

      <section className="rounded-2xl border border-gold bg-white/90 p-6 text-sm leading-6 text-navy/75">
        <h2 className="font-serif text-2xl text-navy">Why opening says “unconfigured”</h2>
        <p className="mt-3">
          Election 1 elects delegates from official campus / school / department
          units. Seats start empty on purpose. The system will not invent “3”.
        </p>
        <p className="mt-2">
          The form labelled <strong>Save configuration</strong> (election name,
          date, start/end time) only stores those fields. It does not allocate
          seats, so <strong>Authorize opening</strong> still refuses.
        </p>
      </section>

      <section className="rounded-2xl border border-navy/10 bg-white/90 p-6 text-sm leading-6 text-navy/75">
        <h2 className="font-serif text-2xl text-navy">Configure seats, then open</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5">
          <li>
            Go to{" "}
            <Link className="font-semibold text-navy underline" href="/commission/election/election-1?tab=structure">
              Election → Electoral College → Electoral structure
            </Link>
            , or use the box on the dashboard.
          </li>
          <li>
            In <em>Explicit seats for unconfigured all remaining units</em>, type{" "}
            <strong>2</strong> and click <strong>Allocate on all remaining units</strong>.
          </li>
          <li>The red “Needs seat configuration” pills should become seat numbers.</li>
          <li>
            Open{" "}
            <Link className="font-semibold text-navy underline" href="/commission/dashboard">
              Dashboard
            </Link>
            .
          </li>
          <li>
            Click <strong>Authorize opening</strong>. When asked, type the Chair
            password again. Opening is a high-risk action.
          </li>
          <li>
            The lifecycle pill should change to <strong>Voting in progress</strong>.
          </li>
        </ol>
      </section>

      <section className="rounded-2xl border border-navy/10 bg-white/90 p-6 text-sm leading-6 text-navy/75">
        <h2 className="font-serif text-2xl text-navy">After it is open</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>
            Election 1 voting desk:{" "}
            <Link className="font-semibold text-navy underline" href="/elector">
              /elector
            </Link>{" "}
            — Student ID from the mock register, PIN{" "}
            <code className="rounded bg-cream px-1">SAKU2026</code>.
          </li>
          <li>
            Optional fast path to Cabinet: Election 1 → Results → Apply
            demonstration tallies → Finalize elected delegates → Electoral
            College Register → Generate → Verify and activate.
          </li>
          <li>
            Cabinet desk:{" "}
            <Link className="font-semibold text-navy underline" href="/vote">
              /vote
            </Link>{" "}
            — registration number from that register, OTP{" "}
            <code className="rounded bg-cream px-1">202026</code> on the hosted demo.
          </li>
        </ul>
      </section>
    </div>
  );
}
