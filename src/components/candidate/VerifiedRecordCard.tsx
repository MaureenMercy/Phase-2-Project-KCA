import type { PublicStudentIdentity } from "@/lib/identity";

export function VerifiedRecordCard({
  identity,
  children,
}: {
  identity: PublicStudentIdentity;
  children?: React.ReactNode;
}) {
  const rows = [
    ["Student registration number", identity.studentId],
    ["Full name", identity.fullName],
    ["National ID", identity.nationalIdMasked],
    ["Mobile number", identity.phoneMasked],
    ["Campus", identity.campusName],
    ["School", identity.schoolName],
    ["Academic programme / department", identity.programmeLabel],
  ];

  return (
    <section className="candidate-card p-6">
      <p className="text-[11px] font-semibold tracking-[0.18em] text-navy/50 uppercase">
        Verified student record
      </p>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-navy/70">
        These details come from the mock student register. They cannot be edited here. If something
        is wrong, request a correction.
      </p>
      <dl className="mt-5 grid gap-4 sm:grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs font-semibold tracking-wide text-navy/50 uppercase">{label}</dt>
            <dd className="mt-1 text-base font-medium text-navy">{value}</dd>
          </div>
        ))}
      </dl>
      {children}
    </section>
  );
}
