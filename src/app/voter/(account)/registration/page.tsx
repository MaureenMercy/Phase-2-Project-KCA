import { PageHeader, StatusPill } from "@/components/commission/PageHeader";
import { CorrectionForm } from "@/components/voter/CorrectionForm";
import { RegistrationStatusCard } from "@/components/voter/StatusCard";
import { formatDateTime } from "@/lib/format";
import { dashboardFrom, requireVoterContext } from "@/lib/voter-guard";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const metadata = { title: "My voter registration" };

export default async function VoterRegistrationPage({
  searchParams,
}: {
  searchParams: Promise<{ ack?: string }>;
}) {
  const context = await requireVoterContext();
  if (!context.profile) redirect("/voter/register");
  const { ack } = await searchParams;
  const model = dashboardFrom({ ...context, profile: context.profile });

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="My Voter Registration" title="Your registration record">
        Keep this reference for support enquiries. Registration and eligibility are different decisions.
      </PageHeader>
      {ack ? (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950" role="status">
          Registration submitted. Your reference is {model.profile.registrationReference}. You are not yet an approved eligible elector until verification is complete.
        </p>
      ) : null}
      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-navy/10 bg-white p-5">
          <p className="text-[10px] tracking-[0.18em] text-navy/40 uppercase">Reference</p>
          <p className="mt-2 font-mono text-2xl text-navy">{model.profile.registrationReference ?? "Draft"}</p>
          <p className="mt-2 text-xs text-navy/55">{formatDateTime(model.profile.registrationDate)}</p>
        </article>
        <RegistrationStatusCard status={model.profile.registrationStatus} />
        <article className="rounded-2xl border border-navy/10 bg-white p-5">
          <p className="text-[10px] tracking-[0.18em] text-navy/40 uppercase">Phone</p>
          <div className="mt-2">
            <StatusPill tone={model.profile.phoneVerifiedAt ? "ok" : "warn"}>
              {model.profile.phoneVerifiedAt ? "Verified" : "Not verified"}
            </StatusPill>
          </div>
          <p className="mt-3 text-sm text-navy/70">OTP codes are not stored as reusable passwords.</p>
        </article>
      </section>
      {model.profile.rejectionReason ? (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-900">{model.profile.rejectionReason}</p>
      ) : null}
      <article className="rounded-2xl border border-navy/10 bg-white p-6">
        <h2 className="font-serif text-2xl">Verified academic information</h2>
        <p className="mt-2 text-sm text-navy/60">Retrieved from the shared student record. You cannot edit these fields directly.</p>
        <ul className="mt-4 grid gap-2 text-sm md:grid-cols-2">
          <li>Campus: {model.academic.campusName}</li>
          <li>School: {model.academic.schoolName}</li>
          <li>Department: {model.academic.departmentName ?? "Not mapped"}</li>
          <li>Programme / course: {model.courseLabel}</li>
          <li>Electoral unit: {model.unitPending ? "Pending configuration" : model.unitLabel}</li>
        </ul>
      </article>
      <CorrectionForm
        campuses={context.store.campuses.map((item) => ({ id: item.id, name: item.name }))}
        schools={context.store.schools.map((item) => ({ id: item.id, name: item.name, campusId: item.campusId }))}
        departments={context.store.departments.map((item) => ({ id: item.id, name: item.name, schoolId: item.schoolId }))}
        programmes={context.store.programmes.map((item) => ({
          id: item.id,
          name: item.name,
          schoolId: item.schoolId,
          departmentId: item.departmentId,
        }))}
      />
    </div>
  );
}
