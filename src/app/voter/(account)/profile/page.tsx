import { PageHeader, StatusPill } from "@/components/commission/PageHeader";
import { maskNationalId, maskPhone } from "@/lib/identity";
import { dashboardFrom, requireVoterContext } from "@/lib/voter-guard";
import { redirect } from "next/navigation";
import { ELECTION2_STATUS_COPY } from "@/lib/voter";

export const dynamic = "force-dynamic";
export const metadata = { title: "My profile" };

export default async function VoterProfilePage() {
  const context = await requireVoterContext();
  if (!context.profile) redirect("/voter/register");
  const model = dashboardFrom({ ...context, profile: context.profile });
  const a11y = context.student.accessibility;

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="My Profile" title="Your voter profile">
        Linked to the shared student identity used by the Candidate and Agent portals. National ID is masked.
      </PageHeader>
      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-navy/10 bg-white p-6">
          <h2 className="font-serif text-2xl">Student information</h2>
          <ul className="mt-3 space-y-1 text-sm text-navy/80">
            <li>Name: {context.student.fullName}</li>
            <li>Student ID: {context.student.studentId}</li>
            <li>National ID: {maskNationalId(context.student.nationalIdLast4)}</li>
            <li>Phone: {maskPhone(model.phone)}</li>
          </ul>
        </article>
        <article className="rounded-2xl border border-navy/10 bg-white p-6">
          <h2 className="font-serif text-2xl">Campus and academic information</h2>
          <ul className="mt-3 space-y-1 text-sm text-navy/80">
            <li>Campus: {model.academic.campusName}</li>
            <li>School: {model.academic.schoolName}</li>
            <li>Department: {model.academic.departmentName ?? "Not mapped"}</li>
            <li>Programme / course: {model.courseLabel}</li>
          </ul>
        </article>
        <article className="rounded-2xl border border-navy/10 bg-white p-6">
          <h2 className="font-serif text-2xl">Registration</h2>
          <p className="mt-2 font-mono">{model.profile.registrationReference ?? "Draft"}</p>
          <div className="mt-3">
            <StatusPill tone={model.statusCopy.tone}>{model.statusCopy.label}</StatusPill>
          </div>
        </article>
        <article className="rounded-2xl border border-navy/10 bg-white p-6">
          <h2 className="font-serif text-2xl">Election standing</h2>
          <ul className="mt-3 space-y-1 text-sm text-navy/80">
            <li>Election 1 eligibility: {model.election1Eligible ? "Eligible" : "Not yet approved"}</li>
            <li>Election 1 participation: {model.election1Participation}</li>
            <li>Election 2: {ELECTION2_STATUS_COPY[model.election2Status].label}</li>
          </ul>
        </article>
      </section>
      <article className="rounded-2xl border border-navy/10 bg-white p-6">
        <h2 className="font-serif text-2xl">Confidential accessibility section</h2>
        <p className="mt-2 text-sm text-navy/60">
          Visible to you here. Shared with polling-station personnel only if you gave consent, and only for practical accommodation.
        </p>
        {a11y.declared ? (
          <ul className="mt-3 text-sm text-navy/80">
            <li>Categories: {a11y.categories.join(", ")}</li>
            <li>Accommodations: {a11y.accommodations.join(", ") || "None listed"}</li>
            <li>Operational consent: {a11y.consentToShareOperationally ? "Yes" : "No"}</li>
          </ul>
        ) : (
          <p className="mt-3 text-sm text-navy/60">No accessibility preferences declared.</p>
        )}
      </article>
    </div>
  );
}
