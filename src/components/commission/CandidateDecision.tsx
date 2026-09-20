"use client";

import { ActionButton } from "@/components/commission/ActionButton";
import { decideCandidate } from "@/lib/actions/auth";

export function CandidateDecision({
  candidateId,
  disabled,
  disabledReason,
}: {
  candidateId: string;
  disabled: boolean;
  disabledReason: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <ActionButton
        label="Approve"
        disabled={disabled}
        disabledReason={disabledReason}
        run={() => decideCandidate(candidateId, "approved")}
      />
      <ActionButton
        label="Reject"
        tone="danger"
        disabled={disabled}
        disabledReason={disabledReason}
        run={() => decideCandidate(candidateId, "rejected")}
      />
    </div>
  );
}
