"use client";

import { useState } from "react";
import { enrollStudent } from "@/lib/actions/enroll";
import type { CourseOption } from "@/lib/courses";

export function EnrollForm({ courses }: { courses: CourseOption[] }) {
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <form
      className="mt-8 space-y-4 text-left"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        setError(null);
        setOk(null);
        const data = new FormData(event.currentTarget);
        const result = await enrollStudent({
          operatorKey: String(data.get("operatorKey") ?? ""),
          fullName: String(data.get("fullName") ?? ""),
          studentId: String(data.get("studentId") ?? ""),
          course: String(data.get("course") ?? ""),
          password: String(data.get("password") ?? ""),
          confirmPassword: String(data.get("confirmPassword") ?? ""),
        });
        setPending(false);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        setOk("The student is stored in MongoDB and can sign in at the voter desk.");
        event.currentTarget.reset();
      }}
    >
      <label className="block">
        <span className="text-[11px] font-semibold tracking-[0.18em] text-gold uppercase">Operator key</span>
        <input
          name="operatorKey"
          type="password"
          autoComplete="off"
          className="mt-2 w-full rounded-sm border border-gold/30 bg-navy-deep/60 px-4 py-3 text-cream outline-none focus:border-gold"
        />
      </label>
      <label className="block">
        <span className="text-[11px] font-semibold tracking-[0.18em] text-gold uppercase">Name</span>
        <input
          name="fullName"
          placeholder="Jane Njeri"
          className="mt-2 w-full rounded-sm border border-gold/30 bg-navy-deep/60 px-4 py-3 text-cream outline-none placeholder:text-cream/30 focus:border-gold"
        />
      </label>
      <label className="block">
        <span className="text-[11px] font-semibold tracking-[0.18em] text-gold uppercase">Admission</span>
        <input
          name="studentId"
          placeholder="24/01299"
          className="mt-2 w-full rounded-sm border border-gold/30 bg-navy-deep/60 px-4 py-3 text-cream outline-none placeholder:text-cream/30 focus:border-gold"
        />
      </label>
      <label className="block">
        <span className="text-[11px] font-semibold tracking-[0.18em] text-gold uppercase">Course</span>
        <select
          name="course"
          defaultValue=""
          className="mt-2 w-full rounded-sm border border-gold/30 bg-navy-deep/60 px-4 py-3 text-cream outline-none focus:border-gold"
        >
          <option value="" disabled>
            Select campus, school, and course
          </option>
          {courses.map((course) => (
            <option key={course.value} value={course.value}>
              {course.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="text-[11px] font-semibold tracking-[0.18em] text-gold uppercase">Password</span>
        <input
          name="password"
          type="password"
          className="mt-2 w-full rounded-sm border border-gold/30 bg-navy-deep/60 px-4 py-3 text-cream outline-none focus:border-gold"
        />
      </label>
      <label className="block">
        <span className="text-[11px] font-semibold tracking-[0.18em] text-gold uppercase">Confirm password</span>
        <input
          name="confirmPassword"
          type="password"
          className="mt-2 w-full rounded-sm border border-gold/30 bg-navy-deep/60 px-4 py-3 text-cream outline-none focus:border-gold"
        />
      </label>
      {error ? (
        <p className="rounded-sm border border-red-300/40 bg-red-950/40 px-3 py-2 text-sm text-red-100">{error}</p>
      ) : null}
      {ok ? (
        <p className="rounded-sm border border-gold/30 bg-navy-deep/50 px-3 py-2 text-sm text-gold">{ok}</p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-sm bg-gold py-3.5 text-sm font-bold tracking-[0.2em] text-navy uppercase hover:bg-gold-light disabled:opacity-60"
      >
        {pending ? "Saving…" : "Register student"}
      </button>
    </form>
  );
}
