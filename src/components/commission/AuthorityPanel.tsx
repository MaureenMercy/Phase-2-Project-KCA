import {
  PERMISSION_LABELS,
  ROLE_LABELS,
  STAGE_LABELS,
  activePermissions,
  roleHasPermission,
  stageBlockedPermissions,
  technicalPermissionsForCommission,
  TECHNICAL_PERMISSION_LABELS,
} from "@/lib/permissions";
import type { CommissionRole, ElectionStage } from "@/lib/types";

export function AuthorityPanel({
  role,
  stage,
}: {
  role: CommissionRole;
  stage: ElectionStage;
}) {
  const now = activePermissions(role, stage);
  const blocked = stageBlockedPermissions(role, stage);
  const technical = technicalPermissionsForCommission();

  return (
    <section className="grid gap-4 lg:grid-cols-3">
      <article className="rounded-sm border border-navy/10 bg-white p-5">
        <p className="text-[10px] tracking-[0.2em] text-gold uppercase">Your authority</p>
        <h2 className="mt-1 font-serif text-2xl text-navy">{ROLE_LABELS[role]}</h2>
        <p className="mt-2 text-sm leading-6 text-navy/70">
          Available now during {STAGE_LABELS[stage].toLowerCase()}.
        </p>
        <ul className="mt-4 space-y-2 text-sm text-navy/80">
          {now.map((permission) => (
            <li key={permission}>• {PERMISSION_LABELS[permission]}</li>
          ))}
        </ul>
      </article>

      <article className="rounded-sm border border-navy/10 bg-white p-5">
        <p className="text-[10px] tracking-[0.2em] text-navy/40 uppercase">
          Held, but not in this stage
        </p>
        <ul className="mt-4 space-y-2 text-sm text-navy/70">
          {blocked.length === 0 ? (
            <li>No additional electoral powers waiting on a later stage.</li>
          ) : (
            blocked.map((permission) => (
              <li key={permission}>• {PERMISSION_LABELS[permission]}</li>
            ))
          )}
        </ul>
        {!roleHasPermission(role, "authorize_results") ? (
          <p className="mt-4 text-xs leading-5 text-navy/50">
            Official results authorization is a special privilege of the Commission
            Chair. It is not inherited from a successful login.
          </p>
        ) : null}
      </article>

      <article className="rounded-sm border border-gold/40 bg-navy p-5 text-cream">
        <p className="text-[10px] tracking-[0.2em] text-gold uppercase">
          Outside electoral authority
        </p>
        <p className="mt-2 text-sm leading-6 text-cream/75">
          These remain ICT/system administration functions. They are never granted
          to Commission accounts.
        </p>
        <ul className="mt-4 space-y-2 text-sm text-cream/80">
          {technical.map((permission) => (
            <li key={permission}>
              • {TECHNICAL_PERMISSION_LABELS[permission as keyof typeof TECHNICAL_PERMISSION_LABELS]}
            </li>
          ))}
        </ul>
      </article>
    </section>
  );
}
