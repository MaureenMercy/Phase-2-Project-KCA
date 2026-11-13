import type { AppStore, Programme, StudentElector } from "@/lib/types";

export type AcademicSnapshot = {
  campusId: string;
  campusName: string;
  schoolId: string;
  schoolName: string;
  departmentId: string | null;
  departmentName: string | null;
  programmeId: string | null;
  programmeName: string | null;
  programmePending: boolean;
};

export function schoolsForCampus(store: AppStore, campusId: string) {
  return store.schools.filter((school) => school.campusId === campusId && school.status === "active");
}

export function departmentsForSchool(store: AppStore, schoolId: string) {
  return store.departments.filter((department) => department.schoolId === schoolId && department.status === "active");
}

export function programmesForDepartment(
  store: AppStore,
  schoolId: string,
  departmentId: string | null,
): Programme[] {
  return store.programmes.filter(
    (programme) =>
      programme.status === "active" &&
      programme.schoolId === schoolId &&
      (programme.departmentId ?? null) === (departmentId ?? null),
  );
}

export function academicSnapshot(store: AppStore, student: StudentElector): AcademicSnapshot {
  const campus = store.campuses.find((item) => item.id === student.campusId);
  const school = store.schools.find((item) => item.id === student.schoolId);
  const department = student.departmentId
    ? store.departments.find((item) => item.id === student.departmentId)
    : null;
  const programmes = programmesForDepartment(store, student.schoolId, student.departmentId);
  const programme =
    (student.programId ? programmes.find((item) => item.id === student.programId) : null) ??
    (programmes.length === 1 ? programmes[0] : null);
  const derivedCourse =
    student.courseLabel ||
    department?.name.replace(/^Department of /, "") ||
    null;

  return {
    campusId: student.campusId,
    campusName: campus?.name ?? "Unknown campus",
    schoolId: student.schoolId,
    schoolName: school?.name ?? "Unknown school",
    departmentId: student.departmentId,
    departmentName: department?.name ?? null,
    programmeId: programme?.id ?? student.programId,
    programmeName: programme?.name ?? derivedCourse,
    programmePending: !programme && !derivedCourse,
  };
}

export function courseLabelForStudent(store: AppStore, student: StudentElector) {
  const snapshot = academicSnapshot(store, student);
  if (snapshot.programmeName) return snapshot.programmeName;
  if (snapshot.departmentName) return snapshot.departmentName.replace(/^Department of /, "");
  return snapshot.schoolName;
}
