import { academicLabels, campusDisplayName, maskNationalId } from "@/lib/identity";
import { resolveUnits } from "@/lib/electoral";
import { normalizeStudentId } from "@/lib/student-auth";
import type {
  AgentNomination,
  AppStore,
  ApplicationWindow,
  CandidatePortalApplication,
  CandidateApplicationType,
  CandidateDeclarations,
  CouncilPositionConfig,
  DerivedElectoralCollege,
  PortalConfig,
  StudentIdentity,
} from "@/lib/types";

export const EMPTY_DECLARATIONS: CandidateDeclarations = {
  informationAccurate: false,
  understandNotApproval: false,
  consentToProcessIdentity: false,
  acceptCandidateDeclaration: false,
};

const CAMPUS_WIDE_COLLEGES = new Set(["campus-town", "campus-kitengela"]);
const DEPARTMENT_COLLEGES = new Set(["campus-ruaraka"]);
const SCHOOL_GROUP_COLLEGES = new Set(["campus-western"]);

export const APPLICATION_STEPS = [
  { id: 1, label: "Identity", description: "Confirm who you are" },
  { id: 2, label: "Election", description: "Choose which election" },
  { id: 3, label: "Details", description: "Review the contest details" },
  { id: 4, label: "Documents", description: "Upload what is required" },
  { id: 5, label: "Review", description: "Check and send" },
] as const;

export function electionTypeLabel(type: CandidateApplicationType | null) {
  if (type === "DELEGATE") return "Election 1 — Delegates Election";
  if (type === "SAKU_COUNCIL") return "Election 2 — SAKU Council Election";
  return "Not selected";
}

export function statusExplanation(status: CandidatePortalApplication["status"]) {
  switch (status) {
    case "Draft":
      return "Saved on this portal. It has not been sent to the Electoral Commission.";
    case "Submitted":
      return "Received by the Electoral Commission. Submitted is not the same as approved.";
    case "Under Review":
      return "The Electoral Commission is reviewing this application.";
    case "Awaiting Additional Information":
      return "The Electoral Commission has asked for more information before it can continue.";
    case "Approved":
      return "This application is approved. Approval does not place you on an official ballot.";
    case "Rejected":
      return "The Electoral Commission did not approve this application.";
    default:
      return "";
  }
}

export function ballotParticipationLabel(status: CandidatePortalApplication["ballotParticipationStatus"]) {
  switch (status) {
    case "configured_on_ballot":
      return "Configured on an official ballot";
    case "removed_from_ballot":
      return "Removed from the official ballot";
    default:
      return "Not yet configured on a ballot";
  }
}

export function deriveElectoralCollege(
  store: AppStore,
  identity: Pick<StudentIdentity, "campusId" | "schoolId" | "departmentId">,
): DerivedElectoralCollege {
  const campus = store.campuses.find((item) => item.id === identity.campusId);
  const school = store.schools.find((item) => item.id === identity.schoolId);
  const department = identity.departmentId
    ? store.departments.find((item) => item.id === identity.departmentId)
    : null;
  const pending = (label: string): DerivedElectoralCollege => ({
    kind: null,
    campusId: identity.campusId,
    schoolId: identity.schoolId,
    departmentId: identity.departmentId,
    unitId: null,
    label,
    mappingStatus: "pending_configuration",
  });

  if (!campus || !school) {
    return pending(
      "The Electoral College for this student record is awaiting Electoral Commission configuration.",
    );
  }

  const campusName = campusDisplayName(campus.id, campus.name);

  if (CAMPUS_WIDE_COLLEGES.has(campus.id)) {
    return {
      kind: "CAMPUS",
      campusId: campus.id,
      schoolId: school.id,
      departmentId: null,
      unitId: null,
      label: `${campus.name} Campus Electoral College`,
      mappingStatus: "resolved",
    };
  }

  if (DEPARTMENT_COLLEGES.has(campus.id)) {
    if (!department) {
      return pending(
        "A department Electoral College has not been configured for this Ruaraka record.",
      );
    }
    const unit = resolveUnits(store).find(
      (item) =>
        item.campusId === campus.id &&
        item.schoolId === school.id &&
        item.departmentId === department.id,
    );
    if (!unit) {
      return pending(
        `No Electoral College is configured for ${campusName} · ${school.name} · ${department.name.replace(/^Department of /i, "")}.`,
      );
    }
    return {
      kind: "DEPARTMENT",
      campusId: campus.id,
      schoolId: school.id,
      departmentId: department.id,
      unitId: unit.id,
      label: `${campusName} · ${school.name} · ${department.name.replace(/^Department of /i, "")}`,
      mappingStatus: "resolved",
    };
  }

  if (SCHOOL_GROUP_COLLEGES.has(campus.id)) {
    if (department) {
      const unit = resolveUnits(store).find(
        (item) =>
          item.campusId === campus.id &&
          item.schoolId === school.id &&
          item.departmentId === department.id,
      );
      if (!unit) {
        return pending(
          `No Electoral College is configured for this Western / Kisumu department grouping.`,
        );
      }
      return {
        kind: "DEPARTMENT",
        campusId: campus.id,
        schoolId: school.id,
        departmentId: department.id,
        unitId: unit.id,
        label: `${campusName} · ${school.name} · ${department.name.replace(/^Department of /i, "")}`,
        mappingStatus: "resolved",
      };
    }
    const unit = resolveUnits(store).find(
      (item) =>
        item.campusId === campus.id &&
        item.schoolId === school.id &&
        item.departmentId === null,
    );
    if (!unit) {
      return pending(
        `No Electoral College is configured for the ${school.name} grouping at Western / Kisumu.`,
      );
    }
    return {
      kind: "SCHOOL",
      campusId: campus.id,
      schoolId: school.id,
      departmentId: null,
      unitId: unit.id,
      label: `${campusName} · ${school.name}`,
      mappingStatus: "resolved",
    };
  }

  return pending(
    "The Electoral College mapping for this campus is awaiting Electoral Commission configuration.",
  );
}

export function windowForType(config: PortalConfig, type: CandidateApplicationType) {
  return config.applicationWindows[type];
}

export function applicationWindowState(window: ApplicationWindow, now = new Date()) {
  if (window.status !== "configured" || !window.opensAt || !window.closesAt) {
    return {
      open: false as const,
      reason: "Application dates have not been set by the Electoral Commission.",
    };
  }
  const opens = new Date(window.opensAt);
  const closes = new Date(window.closesAt);
  if (Number.isNaN(opens.getTime()) || Number.isNaN(closes.getTime())) {
    return {
      open: false as const,
      reason: "Application dates have not been set by the Electoral Commission.",
    };
  }
  if (now < opens) {
    return {
      open: false as const,
      reason: "Applications for this election are not open yet.",
    };
  }
  if (now > closes) {
    return {
      open: false as const,
      reason: "The application window for this election has closed.",
    };
  }
  return { open: true as const, reason: null };
}

export function openCouncilPositions(config: PortalConfig) {
  return config.councilPositions.filter((position) => position.openForApplications);
}

export function councilPositionById(config: PortalConfig, id: string | null) {
  if (!id) return null;
  return config.councilPositions.find((position) => position.id === id) ?? null;
}

export function jointTicketBlocked(config: PortalConfig, position: CouncilPositionConfig | null) {
  return Boolean(
    position?.jointTicket && config.jointTicketWorkflowStatus !== "configured",
  );
}

export function requiredDocumentsFor(
  config: PortalConfig,
  application: Pick<CandidatePortalApplication, "applicationType" | "councilPositionId">,
) {
  if (application.applicationType === "DELEGATE") {
    return config.delegateRequiredDocuments.filter((item) => item.required);
  }
  if (application.applicationType === "SAKU_COUNCIL") {
    const position = councilPositionById(config, application.councilPositionId);
    return position?.requiredDocuments.filter((item) => item.required) ?? [];
  }
  return [];
}

export function documentPresent(application: CandidatePortalApplication, kind: string) {
  return application.documents.some((item) => item.kind === kind && item.dataUrl);
}

export function isLockedStatus(status: CandidatePortalApplication["status"]) {
  return status !== "Draft" && status !== "Awaiting Additional Information";
}

export function canEditApplication(status: CandidatePortalApplication["status"]) {
  return status === "Draft" || status === "Awaiting Additional Information";
}

export function isSubmittedOrLater(status: CandidatePortalApplication["status"]) {
  return status !== "Draft";
}

export function activeApplicationOfType(
  store: AppStore,
  studentId: string,
  type: CandidateApplicationType,
) {
  const key = normalizeStudentId(studentId);
  return store.candidatePortalApplications.find(
    (item) =>
      normalizeStudentId(item.studentId) === key &&
      item.applicationType === type &&
      item.status !== "Rejected",
  ) ?? null;
}

export function applicationsForStudent(store: AppStore, studentId: string) {
  const key = normalizeStudentId(studentId);
  return store.candidatePortalApplications
    .filter((item) => normalizeStudentId(item.studentId) === key)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function nominationsForApplication(store: AppStore, applicationId: string) {
  return store.agentNominations.filter(
    (item) => item.candidateApplicationId === applicationId && item.status === "invited",
  );
}

export function nextApplicationReference(store: AppStore, year: number) {
  const used = new Set(
    store.candidatePortalApplications.map((item) => item.reference).filter(Boolean) as string[],
  );
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const suffix = String(1000 + Math.floor(Math.random() * 9000));
    const reference = `CAN-${year}-${suffix}`;
    if (!used.has(reference)) return reference;
  }
  return `CAN-${year}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

export function nextInvitationReference(store: AppStore, year: number) {
  const used = new Set(store.agentNominations.map((item) => item.invitationReference));
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const suffix = String(2000 + Math.floor(Math.random() * 8000));
    const reference = `AGN-${year}-${suffix}`;
    if (!used.has(reference)) return reference;
  }
  return `AGN-${year}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

export type FieldError = { field: string; message: string };

export function validateSubmission(
  store: AppStore,
  application: CandidatePortalApplication,
  now = new Date(),
): FieldError[] {
  const errors: FieldError[] = [];
  const identity = store.studentIdentities.find(
    (item) => normalizeStudentId(item.studentId) === normalizeStudentId(application.studentId),
  );
  if (!identity) {
    errors.push({ field: "identity", message: "Your student record could not be found." });
    return errors;
  }

  if (!application.applicationType) {
    errors.push({ field: "applicationType", message: "Select the election you wish to contest." });
    return errors;
  }

  const window = applicationWindowState(
    windowForType(store.portalConfig, application.applicationType),
    now,
  );
  if (!window.open) {
    errors.push({ field: "window", message: window.reason });
  }

  if (application.applicationType === "DELEGATE") {
    const college = application.electoralCollege ?? deriveElectoralCollege(store, identity);
    if (college.mappingStatus !== "resolved") {
      errors.push({
        field: "electoralCollege",
        message:
          college.label ||
          "Your Electoral College is awaiting Electoral Commission configuration.",
      });
    }
    if (application.councilPositionId) {
      errors.push({
        field: "councilPositionId",
        message: "A Delegates Election application cannot include a SAKU Council position.",
      });
    }
  }

  if (application.applicationType === "SAKU_COUNCIL") {
    const position = councilPositionById(store.portalConfig, application.councilPositionId);
    if (!position) {
      errors.push({
        field: "councilPositionId",
        message: "Select an approved SAKU Council position that is open for applications.",
      });
    } else if (!position.openForApplications) {
      errors.push({
        field: "councilPositionId",
        message: "That position is not currently open for applications.",
      });
    } else if (jointTicketBlocked(store.portalConfig, position)) {
      errors.push({
        field: "councilPositionId",
        message:
          "The President / Vice President joint-ticket process is awaiting Electoral Commission configuration.",
      });
    }
  }

  if (!application.photograph?.dataUrl) {
    errors.push({ field: "photograph", message: "A candidate photograph is required." });
  }

  for (const document of requiredDocumentsFor(store.portalConfig, application)) {
    if (!documentPresent(application, document.id)) {
      errors.push({
        field: `document:${document.id}`,
        message: `Upload the required file: ${document.label}.`,
      });
    }
  }

  if (!application.declarations.informationAccurate) {
    errors.push({ field: "informationAccurate", message: "Confirm that your information is true." });
  }
  if (!application.declarations.understandNotApproval) {
    errors.push({
      field: "understandNotApproval",
      message: "Confirm that you understand sending this form is not approval.",
    });
  }
  if (!application.declarations.consentToProcessIdentity) {
    errors.push({
      field: "consentToProcessIdentity",
      message: "Consent is required to process your identity details for this application.",
    });
  }
  if (!application.declarations.acceptCandidateDeclaration) {
    errors.push({
      field: "acceptCandidateDeclaration",
      message: "Accept the candidate declaration to continue.",
    });
  }

  return errors;
}

export function duplicateSubmissionError(application: CandidatePortalApplication) {
  if (application.status === "Draft") return null;
  if (application.reference) {
    return `This application has already been submitted. Reference: ${application.reference}. Submitted is not the same as approved.`;
  }
  return "This application has already been submitted. Submitted is not the same as approved.";
}

export function canNominateAgents(application: CandidatePortalApplication) {
  return application.status === "Approved" && application.applicationType === "SAKU_COUNCIL";
}

export function agentCapacity(
  config: PortalConfig,
  nominations: AgentNomination[],
) {
  const active = nominations.filter((item) => item.status === "invited");
  return {
    max: config.maxAgentsPerCandidate,
    used: active.length,
    remaining: Math.max(0, config.maxAgentsPerCandidate - active.length),
  };
}

export function filteredSchools(store: AppStore, campusId: string) {
  return store.schools.filter((school) => school.campusId === campusId && school.status === "active");
}

export function filteredDepartments(store: AppStore, schoolId: string) {
  return store.departments.filter(
    (department) => department.schoolId === schoolId && department.status === "active",
  );
}

export function snapshotIdentityOntoApplication(
  identity: StudentIdentity,
  application: CandidatePortalApplication,
  college: DerivedElectoralCollege,
): CandidatePortalApplication {
  return {
    ...application,
    campusId: identity.campusId,
    schoolId: identity.schoolId,
    departmentId: identity.departmentId,
    programId: identity.programId,
    electoralCollege: college,
  };
}

export function applicationSummary(
  store: AppStore,
  application: CandidatePortalApplication,
  identity: StudentIdentity,
) {
  const academic = academicLabels(store, identity);
  const position = councilPositionById(store.portalConfig, application.councilPositionId);
  return {
    studentId: identity.studentId,
    fullName: identity.fullName,
    nationalIdMasked: maskNationalId(identity.nationalIdLast4),
    election: electionTypeLabel(application.applicationType),
    ...academic,
    electoralCollege: application.electoralCollege,
    councilPosition: position?.title ?? null,
    photograph: application.photograph
      ? { filename: application.photograph.filename, uploaded: true }
      : null,
    documents: application.documents.map((item) => ({
      kind: item.kind,
      filename: item.filename,
    })),
    declarations: application.declarations,
    status: application.status,
    reference: application.reference,
    ballotParticipation: ballotParticipationLabel(application.ballotParticipationStatus),
  };
}

export function emptyApplication(input: {
  id: string;
  studentId: string;
  candidateProfileId: string;
  electionId: string;
  identity: StudentIdentity;
  now: string;
}): CandidatePortalApplication {
  return {
    id: input.id,
    reference: null,
    studentId: input.studentId,
    candidateProfileId: input.candidateProfileId,
    electionId: input.electionId,
    applicationType: null,
    status: "Draft",
    currentStep: 2,
    campusId: input.identity.campusId,
    schoolId: input.identity.schoolId,
    departmentId: input.identity.departmentId,
    programId: input.identity.programId,
    electoralCollege: null,
    councilPositionId: null,
    photograph: null,
    documents: [],
    declarations: { ...EMPTY_DECLARATIONS },
    outstandingRequirements: [],
    ballotParticipationStatus: "not_configured",
    submittedAt: null,
    decidedAt: null,
    decidedBy: null,
    decisionNote: null,
    createdAt: input.now,
    updatedAt: input.now,
  };
}
