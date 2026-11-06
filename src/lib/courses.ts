import { CAMPUSES, DEPARTMENTS, SCHOOLS } from "@/lib/seed";

export type CourseOption = {
  value: string;
  label: string;
  campusId: string;
  schoolId: string;
  departmentId: string | null;
};

export function courseOptions(): CourseOption[] {
  return SCHOOLS.filter((school) => school.status === "active").flatMap((school): CourseOption[] => {
    const campus = CAMPUSES.find((item) => item.id === school.campusId);
    const departments = DEPARTMENTS.filter((dept) => dept.schoolId === school.id && dept.status === "active");
    if (departments.length === 0) {
      return [
        {
          value: `${school.campusId}|${school.id}|`,
          label: `${campus?.name ?? "Campus"} · ${school.name}`,
          campusId: school.campusId,
          schoolId: school.id,
          departmentId: null,
        },
      ];
    }
    return departments.map((department) => ({
      value: `${school.campusId}|${school.id}|${department.id}`,
      label: `${campus?.name ?? "Campus"} · ${school.name} · ${department.name.replace(/^Department of /, "")}`,
      campusId: school.campusId,
      schoolId: school.id,
      departmentId: department.id,
    }));
  });
}

export function parseCourseValue(value: string): CourseOption | null {
  return courseOptions().find((option) => option.value === value) ?? null;
}
