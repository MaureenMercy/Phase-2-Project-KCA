"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { parseCourseValue } from "@/lib/courses";
import { enrolledToMapping, enrolledToStudent } from "@/lib/enrolled-students";
import { opsFindEnrolled, opsSaveEnrolled } from "@/lib/ops-client";
import { writeStore } from "@/lib/store";
import { normalizeStudentId } from "@/lib/student-auth";
import type { ActionResult } from "@/lib/actions/auth";

const OPERATOR_KEY = process.env.SAKU_ENROLL_KEY ?? "KCA-ROLL-2026";

const EnrollSchema = z.object({
  operatorKey: z.string().trim().min(1),
  fullName: z.string().trim().min(3, "Enter the student’s full name.").max(80),
  studentId: z
    .string()
    .trim()
    .regex(/^[0-9]{2}\/[0-9]{4,6}$/, "Use an admission number such as 24/01299."),
  course: z.string().trim().min(1, "Choose a course."),
  password: z.string().min(6, "Set a password of at least 6 characters."),
  confirmPassword: z.string().min(6),
});

export async function enrollStudent(input: {
  operatorKey: string;
  fullName: string;
  studentId: string;
  course: string;
  password: string;
  confirmPassword: string;
}): Promise<ActionResult> {
  const parsed = EnrollSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the registration details." };
  }
  if (parsed.data.operatorKey !== OPERATOR_KEY) {
    return { ok: false, error: "That roll is closed." };
  }
  if (parsed.data.password !== parsed.data.confirmPassword) {
    return { ok: false, error: "The password and confirmation do not match." };
  }

  const course = parseCourseValue(parsed.data.course);
  if (!course) {
    return { ok: false, error: "Choose a course from the official campus list." };
  }

  const studentId = parsed.data.studentId.trim();
  const existing = await opsFindEnrolled(studentId);
  if (existing) {
    return { ok: false, error: "That admission number is already on the operator roll." };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const enrolledAt = new Date().toISOString();
  const row = {
    studentId,
    fullName: parsed.data.fullName,
    campusId: course.campusId,
    schoolId: course.schoolId,
    departmentId: course.departmentId,
    courseLabel: course.label,
    passwordHash,
    enrolledAt,
  };

  const saved = await opsSaveEnrolled(row);
  if (!saved) {
    return { ok: false, error: "The student could not be stored in the database. Keep the operations API running." };
  }

  const key = normalizeStudentId(studentId);
  await writeStore((store) => {
    if (!store.studentElectors.some((item) => normalizeStudentId(item.studentId) === key)) {
      store.studentElectors.push(enrolledToStudent(row));
    }
    if (!store.studentMappings.some((item) => normalizeStudentId(item.studentId) === key)) {
      store.studentMappings.push(enrolledToMapping(row));
    }
    store.voterRegister.voterCount = store.studentElectors.length;
    return store;
  });

  return { ok: true };
}
