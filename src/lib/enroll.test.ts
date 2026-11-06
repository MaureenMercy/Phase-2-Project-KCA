import bcrypt from "bcryptjs";
import { describe, expect, it } from "vitest";
import { courseOptions, parseCourseValue } from "@/lib/courses";
import { mergeEnrolledIntoStore } from "@/lib/enrolled-students";
import { createInitialStore } from "@/lib/seed";
import { pinMatchesStudent } from "@/lib/student-auth";

describe("operator student roll", () => {
  it("lists official campus courses including Ruaraka School of Business", () => {
    const options = courseOptions();
    expect(options.some((item) => item.label.includes("Ruaraka") && item.label.includes("Business"))).toBe(true);
    const parsed = parseCourseValue("campus-ruaraka|school-ru-bus|dept-ru-bus-bam");
    expect(parsed?.campusId).toBe("campus-ruaraka");
    expect(parsed?.departmentId).toBe("dept-ru-bus-bam");
  });

  it("accepts a seeded PIN and an enrolled password hash", async () => {
    await expect(pinMatchesStudent({ pin: "SAKU2026" })).resolves.toBe(true);
    await expect(pinMatchesStudent({ pin: "wrong" })).resolves.toBe(false);
    const hash = await bcrypt.hash("VoteNow26", 4);
    await expect(pinMatchesStudent({ pin: "VoteNow26", enrolledPasswordHash: hash })).resolves.toBe(true);
    await expect(pinMatchesStudent({ pin: "SAKU2026", enrolledPasswordHash: hash })).resolves.toBe(false);
  });

  it("overlays an enrolled student into the Election 1 register without dropping seeds", () => {
    const store = mergeEnrolledIntoStore(createInitialStore(), [
      {
        studentId: "24/09901",
        fullName: "Hidden Test Student",
        campusId: "campus-ruaraka",
        schoolId: "school-ru-bus",
        departmentId: "dept-ru-bus-bam",
        courseLabel: "Ruaraka · School of Business · Business Administration and Management",
        enrolledAt: "2026-11-06T07:00:00.000Z",
      },
    ]);
    expect(store.studentElectors.some((item) => item.studentId === "24/01201")).toBe(true);
    const enrolled = store.studentElectors.find((item) => item.studentId === "24/09901");
    expect(enrolled?.eligibilitySource).toBe("operator_enrollment");
    expect(enrolled?.courseLabel).toContain("School of Business");
    expect(store.studentMappings.some((item) => item.studentId === "24/09901")).toBe(true);
  });
});
