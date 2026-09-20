import { ActionButton } from "@/components/commission/ActionButton";
import { approveVoterRegister } from "@/lib/actions/auth";
import { formatDateTime, formatNumber } from "@/lib/format";
import { isAllowedNow } from "@/lib/permissions";
import { requireAuthorizedSession } from "@/lib/session";
import { readStore } from "@/lib/store";

export const metadata = { title: "Voter register" };
export const dynamic = "force-dynamic";

export default async function VoterRegisterPage() {
  const session = await requireAuthorizedSession();
  const store = await readStore();
  const register = store.voterRegister;
  const canApprove = isAllowedNow(
    session.role!,
    "approve_voter_register",
    store.election.stage,
  );

  return (
    <div className="space-y-6">
      <header>
        <p className="text-[11px] tracking-[0.22em] text-navy/40 uppercase">Roll</p>
        <h1 className="font-serif text-4xl text-navy">Voter register</h1>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-sm border border-navy/10 bg-white p-6">
          <p className="text-[10px] tracking-[0.18em] text-navy/40 uppercase">Version</p>
          <p className="mt-2 font-serif text-3xl text-navy">{register.version}</p>
          <p className="mt-4 text-sm text-navy/65">
            {formatNumber(register.voterCount)} eligible student voters.
          </p>
          <p className="mt-2 text-sm capitalize text-navy/65">Status: {register.status}</p>
        </article>
        <article className="rounded-sm border border-navy/10 bg-white p-6">
          <p className="text-sm text-navy/70">
            Submitted {formatDateTime(register.submittedAt)} and last approved
            by {register.approvedBy ?? "—"} on {formatDateTime(register.approvedAt)}.
          </p>
          <div className="mt-6">
            <ActionButton
              label="Approve register"
              run={approveVoterRegister}
              disabled={!canApprove}
              disabledReason={
                session.role === "COMMISSIONER"
                  ? "Commissioners do not hold final voter-register approval. This is an operational power of the Chair, Vice Chair, and Secretary General, and only during registration."
                  : "The register can only be approved during the registration period."
              }
            />
          </div>
        </article>
      </section>
    </div>
  );
}
