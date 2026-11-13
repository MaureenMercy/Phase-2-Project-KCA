import { redirect } from "next/navigation";
import { academicSnapshot, courseLabelForStudent } from "@/lib/academic";
import { readElectorSession } from "@/lib/elector-session";
import { unitForStudent, unitLabel } from "@/lib/electoral";
import { readStore } from "@/lib/store";
import { voterDashboardModel, voterProfileFor } from "@/lib/voter";

export async function loadVoterContext() {
  const session = await readElectorSession();
  if (!session?.electorId.startsWith("voter:")) return null;
  const studentId = session.electorId.replace("voter:", "");
  const store = await readStore();
  const student = store.studentElectors.find((item) => item.studentId === studentId);
  if (!student) return null;
  const profile = voterProfileFor(store, studentId);
  return { store, session, student, profile };
}

export async function requireVoterContext() {
  const context = await loadVoterContext();
  if (!context) redirect("/voter");
  return context;
}

export async function requireRegisteredVoter() {
  const context = await requireVoterContext();
  if (!context.profile || context.profile.registrationStatus === "DRAFT") {
    redirect("/voter/register");
  }
  return { ...context, profile: context.profile };
}

export function wizardSnapshotFrom(context: NonNullable<Awaited<ReturnType<typeof loadVoterContext>>>) {
  const { store, student, profile } = context;
  const academic = academicSnapshot(store, student);
  const unit = unitForStudent(store, student);
  return {
    step: profile?.draftStep ?? 1,
    submitted: Boolean(profile && profile.registrationStatus !== "DRAFT"),
    studentId: student.studentId,
    fullName: student.fullName,
    phoneNumber: profile?.phoneNumber || student.phoneNumber || "",
    phoneVerified: Boolean(profile?.phoneVerifiedAt),
    nationalIdLast4: student.nationalIdLast4 ?? "",
    campusName: academic.campusName,
    schoolName: academic.schoolName,
    departmentName: academic.departmentName,
    programmeName: academic.programmeName ?? courseLabelForStudent(store, student),
    programmePending: academic.programmePending && !academic.programmeName,
    unitLabel: unit ? unitLabel(unit) : null,
    unitPending: Boolean(profile?.electoralUnitPending || !unit),
    documentPolicy: store.identityDocumentPolicy,
    accessibility: student.accessibility,
    campuses: store.campuses.map((item) => ({ id: item.id, name: item.name })),
    schools: store.schools.map((item) => ({ id: item.id, name: item.name, campusId: item.campusId })),
    departments: store.departments.map((item) => ({ id: item.id, name: item.name, schoolId: item.schoolId })),
    programmes: store.programmes.map((item) => ({
      id: item.id,
      name: item.name,
      schoolId: item.schoolId,
      departmentId: item.departmentId,
    })),
  };
}

export function dashboardFrom(context: {
  store: NonNullable<Awaited<ReturnType<typeof loadVoterContext>>>["store"];
  student: NonNullable<Awaited<ReturnType<typeof loadVoterContext>>>["student"];
  profile: NonNullable<NonNullable<Awaited<ReturnType<typeof loadVoterContext>>>["profile"]>;
}) {
  return voterDashboardModel(context.store, context.student, context.profile);
}
