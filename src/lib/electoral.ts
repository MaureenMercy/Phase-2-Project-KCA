import type {
  AppStore,
  CabinetContestId,
  DelegateCandidate,
  ElectedDelegate,
  ElectoralCollegeEntry,
  ElectoralUnitConfiguration,
  School,
  StudentElector,
} from "@/lib/types";
import { CABINET_CONTEST_IDS } from "@/lib/types";

export type ResolvedUnit = {
  id: string;
  key: string;
  campusId: string;
  campusName: string;
  schoolId: string;
  schoolName: string;
  departmentId: string | null;
  departmentName: string | null;
  delegateSeats: number | null;
  seatStatus: ElectoralUnitConfiguration["seatStatus"];
  status: ElectoralUnitConfiguration["status"];
};

export function unitKey(input: {
  electionId: string;
  campusId: string;
  schoolId: string;
  departmentId?: string | null;
}) {
  return [
    input.electionId,
    input.campusId,
    input.schoolId,
    input.departmentId ?? "school",
  ].join("::");
}

export function resolveUnits(store: AppStore): ResolvedUnit[] {
  return store.electoralUnits
    .filter((unit) => unit.status === "active")
    .map((unit) => {
      const campus = store.campuses.find((item) => item.id === unit.campusId);
      const school = store.schools.find((item) => item.id === unit.schoolId);
      const department = unit.departmentId
        ? store.departments.find((item) => item.id === unit.departmentId)
        : null;
      return {
        id: unit.id,
        key: unitKey(unit),
        campusId: unit.campusId,
        campusName: campus?.name ?? "Unknown campus",
        schoolId: unit.schoolId,
        schoolName: school?.name ?? "Unknown school",
        departmentId: unit.departmentId,
        departmentName: department?.name ?? null,
        delegateSeats: unit.delegateSeats,
        seatStatus: unit.seatStatus,
        status: unit.status,
      };
    });
}

export function unitLabel(unit: Pick<ResolvedUnit, "campusName" | "schoolName" | "departmentName">) {
  return unit.departmentName
    ? `${unit.campusName} · ${unit.schoolName} · ${unit.departmentName}`
    : `${unit.campusName} · ${unit.schoolName}`;
}

export function mappingForStudent(store: AppStore, studentId: string) {
  return (
    store.studentMappings.find(
      (mapping) =>
        mapping.studentId === studentId && mapping.electionId === store.election.id,
    ) ?? null
  );
}

export function unitForStudent(store: AppStore, student: StudentElector) {
  const mapping = mappingForStudent(store, student.studentId);
  const campusId = mapping?.campusId ?? student.campusId;
  const schoolId = mapping?.schoolId ?? student.schoolId;
  const departmentId = mapping?.departmentId ?? student.departmentId;
  return (
    resolveUnits(store).find(
      (unit) =>
        unit.campusId === campusId &&
        unit.schoolId === schoolId &&
        (unit.departmentId ?? null) === (departmentId ?? null),
    ) ?? null
  );
}

export function candidatesForUnit(store: AppStore, unit: ResolvedUnit) {
  return store.delegateCandidates.filter(
    (candidate) =>
      candidate.electionId === store.election.id &&
      candidate.status === "active" &&
      candidate.approvalStatus === "approved" &&
      candidate.campusId === unit.campusId &&
      candidate.schoolId === unit.schoolId &&
      (candidate.departmentId ?? null) === (unit.departmentId ?? null),
  );
}

export type Election1Ballot = {
  unit: ResolvedUnit;
  seats: number | null;
  seatsConfigured: boolean;
  candidates: DelegateCandidate[];
  warning?: string;
};

export function generateElection1Ballot(
  store: AppStore,
  student: StudentElector,
): Election1Ballot | { error: string } {
  const unit = unitForStudent(store, student);
  if (!unit) {
    return { error: "No electoral unit is mapped for this student." };
  }
  const candidates = candidatesForUnit(store, unit);
  const seatsConfigured = typeof unit.delegateSeats === "number" && unit.delegateSeats > 0;
  return {
    unit,
    seats: unit.delegateSeats,
    seatsConfigured,
    candidates,
    warning: seatsConfigured
      ? undefined
      : "Delegate seat allocation has not been configured for this electoral unit.",
  };
}

export type ValidationIssue = {
  code: string;
  message: string;
  unitId?: string;
};

export function validateElection1Readiness(store: AppStore): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const units = resolveUnits(store);

  for (const unit of units) {
    if (!unit.campusId) {
      issues.push({ code: "campus", message: "Electoral unit is missing a campus.", unitId: unit.id });
    }
    if (!unit.schoolId) {
      issues.push({ code: "school", message: "Electoral unit is missing a school.", unitId: unit.id });
    }
    if (typeof unit.delegateSeats !== "number" || unit.delegateSeats < 1) {
      issues.push({
        code: "seats",
        message: `${unitLabel(unit)} has no configured delegate-seat allocation.`,
        unitId: unit.id,
      });
    }
  }

  for (const candidate of store.delegateCandidates.filter((item) => item.status === "active")) {
    const unit = units.find(
      (item) =>
        item.campusId === candidate.campusId &&
        item.schoolId === candidate.schoolId &&
        (item.departmentId ?? null) === (candidate.departmentId ?? null),
    );
    if (!unit) {
      issues.push({
        code: "candidate_unit",
        message: `${candidate.fullName} is mapped to an invalid electoral unit.`,
      });
    }
  }

  for (const student of store.studentElectors.filter((item) => item.eligibilityStatus === "eligible")) {
    if (!unitForStudent(store, student)) {
      issues.push({
        code: "elector_unit",
        message: `${student.fullName} (${student.studentId}) is not mapped to a valid electoral unit.`,
      });
    }
  }

  return issues;
}

export function computeElectedDelegates(store: AppStore): ElectedDelegate[] {
  const elected: ElectedDelegate[] = [];
  for (const unit of resolveUnits(store)) {
    if (typeof unit.delegateSeats !== "number" || unit.delegateSeats < 1) continue;
    const ranked = candidatesForUnit(store, unit)
      .slice()
      .sort((a, b) => b.votesReceived - a.votesReceived || a.fullName.localeCompare(b.fullName));
    ranked.slice(0, unit.delegateSeats).forEach((candidate, index) => {
      elected.push({
        id: `elected-${unit.id}-${index + 1}`,
        electionId: store.election.id,
        studentId: candidate.studentId,
        candidateId: candidate.id,
        unitId: unit.id,
        fullName: candidate.fullName,
        votesReceived: candidate.votesReceived,
        confirmed: false,
      });
    });
  }
  return elected;
}

export function deriveElectoralCollege(
  store: AppStore,
  elected: ElectedDelegate[],
): ElectoralCollegeEntry[] {
  return elected.map((delegate) => {
    const student = store.studentElectors.find((item) => item.studentId === delegate.studentId);
    return {
      id: `college-${delegate.studentId}`,
      electionId: store.election.id,
      studentId: delegate.studentId,
      registrationNumber: delegate.studentId,
      fullName: delegate.fullName,
      campusId: student?.campusId ?? "",
      schoolId: student?.schoolId ?? "",
      departmentId: student?.departmentId ?? null,
      electorStatus: "pending_verification" as const,
    };
  });
}

export const CABINET_CONTESTS: {
  id: CabinetContestId;
  title: string;
  instruction: string;
  kind: "candidate" | "ticket";
}[] = [
  {
    id: "special-interests",
    title: "Special Interests Secretary",
    instruction: "Select ONE candidate.",
    kind: "candidate",
  },
  {
    id: "sports",
    title: "Sports & Entertainment Secretary",
    instruction: "Select ONE candidate.",
    kind: "candidate",
  },
  {
    id: "academic",
    title: "Academic Secretary",
    instruction: "Select ONE candidate.",
    kind: "candidate",
  },
  {
    id: "treasurer",
    title: "Treasurer / Finance Secretary",
    instruction: "Select ONE candidate.",
    kind: "candidate",
  },
  {
    id: "secretary-general",
    title: "Secretary General",
    instruction: "Select ONE candidate.",
    kind: "candidate",
  },
  {
    id: "president-ticket",
    title: "President + Vice President",
    instruction: "Select ONE ticket.",
    kind: "ticket",
  },
];

export function cabinetStepIndex(id: CabinetContestId) {
  return CABINET_CONTEST_IDS.indexOf(id);
}

export function isCabinetBallotComplete(selections: Partial<Record<CabinetContestId, string>>) {
  return CABINET_CONTEST_IDS.every((id) => Boolean(selections[id]));
}

export function schoolsByCampus(schools: School[], campusId: string) {
  return schools.filter((school) => school.campusId === campusId);
}

export function defaultDelegateSeats(): null {
  return null;
}
