import { activePermissions, ROLE_LABELS } from "@/lib/permissions";
import type {
  AuthorizationDecision,
  CommissionMember,
  ElectionRecord,
  InstitutionalUser,
  PipelineStep,
} from "@/lib/types";

type AuthorizeInput = {
  credentialsValid: boolean;
  mfaVerified: boolean;
  directoryUser: InstitutionalUser | null;
  commissionMember: CommissionMember | null;
  election: ElectionRecord;
};

function step(
  key: string,
  label: string,
  status: PipelineStep["status"],
  detail: string,
): PipelineStep {
  return { key, label, status, detail };
}

export function evaluateCommissionAccess(
  input: AuthorizeInput,
): AuthorizationDecision {
  const steps: PipelineStep[] = [];

  steps.push(
    input.credentialsValid
      ? step(
          "credentials",
          "Credential verification",
          "pass",
          "Work ID and institutional password were verified.",
        )
      : step(
          "credentials",
          "Credential verification",
          "fail",
          "Work ID or institutional password could not be verified.",
        ),
  );

  if (!input.credentialsValid || !input.directoryUser) {
    return {
      granted: false,
      steps,
      reason: "Institutional credentials were not verified.",
      failedStep: "credentials",
    };
  }

  const user = input.directoryUser;

  steps.push(
    input.mfaVerified
      ? step(
          "mfa",
          "Multi-factor authentication",
          "pass",
          "One-time verification for this session was completed.",
        )
      : step(
          "mfa",
          "Multi-factor authentication",
          "fail",
          "A valid one-time password was not presented.",
        ),
  );

  if (!input.mfaVerified) {
    return {
      granted: false,
      steps,
      reason: "Multi-factor authentication was not completed.",
      failedStep: "mfa",
    };
  }

  const isCommissionAccount =
    user.accountKind === "commission" && input.commissionMember?.active;

  steps.push(
    isCommissionAccount && input.commissionMember
      ? step(
          "identify",
          "Identify commission member",
          "pass",
          `${user.fullName} is a sitting member of the SAKU Electoral Commission.`,
        )
      : step(
          "identify",
          "Identify commission member",
          "fail",
          user.accountKind === "technical"
            ? "This Work ID belongs to technical staff. ICT functions are not election-operational accounts and cannot enter the Commission portal."
            : "No Electoral Commission membership is attached to this institutional account.",
        ),
  );

  if (!isCommissionAccount || !input.commissionMember) {
    return {
      granted: false,
      steps,
      reason:
        user.accountKind === "technical"
          ? "Technical administration is not granted through the Electoral Commission portal."
          : "This account is not an Electoral Commission member.",
      failedStep: "identify",
    };
  }

  const member = input.commissionMember;

  steps.push(
    step(
      "role",
      "Verify commission role / authority",
      "pass",
      `Authority level: ${ROLE_LABELS[member.role]}. Authentication is not authorization — permitted actions are scoped to this role.`,
    ),
  );

  const assignedToElection = member.electionId === input.election.id;

  steps.push(
    assignedToElection
      ? step(
          "assignment",
          "Check election assignment",
          "pass",
          `Assigned to ${input.election.name}.`,
        )
      : step(
          "assignment",
          "Check election assignment",
          "fail",
          `This member is not assigned to ${input.election.name}.`,
        ),
  );

  if (!assignedToElection) {
    return {
      granted: false,
      steps,
      reason: `Not assigned to ${input.election.name}.`,
      failedStep: "assignment",
    };
  }

  const permissions = activePermissions(member.role, input.election.stage);

  steps.push(
    step(
      "stage",
      "Check current election stage",
      "info",
      `Current stage: ${input.election.stage.replaceAll("_", " ")}. ${permissions.length} electoral action${permissions.length === 1 ? "" : "s"} are available now. Stage-blocked powers remain in the role but cannot be exercised yet.`,
    ),
  );

  steps.push(
    step(
      "grant",
      "Grant authorized access",
      "pass",
      `Electoral Commission dashboard access granted as ${ROLE_LABELS[member.role]}. Technical powers (servers, databases, deployment) remain outside this authority.`,
    ),
  );

  return {
    granted: true,
    steps,
    role: member.role,
    electionId: input.election.id,
    pollingStationIds: member.pollingStationIds,
    permissions,
  };
}
