import { AccessPolicyForm } from "@/components/commission/AccessPolicyForm";
import { ModuleSubnav, PageHeader } from "@/components/commission/PageHeader";
import { OpsStatusBanner } from "@/components/commission/OpsStatusBanner";
import { opsGetPolicy, opsHealth } from "@/lib/ops-client";
import { isAllowedNow } from "@/lib/permissions";
import { readRequestMeta } from "@/lib/request-meta";
import { requireAuthorizedSession } from "@/lib/session";
import { readStore } from "@/lib/store";

export const metadata = { title: "Workstation access" };
export const dynamic = "force-dynamic";

export default async function AccessPage() {
  const session = await requireAuthorizedSession();
  const store = await readStore();
  const [health, policy, meta] = await Promise.all([opsHealth(), opsGetPolicy(), readRequestMeta()]);
  const canEdit = isAllowedNow(session.role!, "manage_commission_records", store.election.stage);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Integrity" title="Workstation access">
        Campus computers will not all be the same, and they are not autonomous.
        Choose open access when any machine may vote, or restrict the desks to
        known IPs. Every attempt is still written to the operations log.
      </PageHeader>
      <ModuleSubnav
        current="/commission/access"
        items={[
          { href: "/commission/tracking", label: "Who voted" },
          { href: "/commission/access", label: "Workstation access" },
          { href: "/commission/analytics", label: "Analytics" },
        ]}
      />
      <OpsStatusBanner online={Boolean(health?.ok)} currentIp={meta.ip} />
      <section className="rounded-2xl border border-navy/10 bg-white/90 p-6">
        <AccessPolicyForm
          policy={policy}
          currentIp={meta.ip}
          workstationId={meta.workstationId}
          canEdit={canEdit}
        />
        {!canEdit ? (
          <p className="mt-4 text-xs text-navy/50">
            Configuration authority is required to change this policy.
          </p>
        ) : null}
      </section>
    </div>
  );
}
