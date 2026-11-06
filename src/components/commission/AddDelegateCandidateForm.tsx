"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addDelegateCandidate } from "@/lib/actions/candidates";
import type { CourseOption } from "@/lib/courses";

const fieldClass =
  "mt-1 w-full rounded-xl border border-navy/15 bg-white px-3 py-2 text-sm text-navy outline-none focus:border-gold";

export function AddDelegateCandidateForm({
  courses,
  canAdd,
  disabledReason,
}: {
  courses: CourseOption[];
  canAdd: boolean;
  disabledReason: string;
}) {
  const router = useRouter();
  const [formKey, setFormKey] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <form
      key={formKey}
      className="rounded-2xl border border-navy/10 bg-white/90 p-5"
      onSubmit={async (event) => {
        event.preventDefault();
        if (!canAdd) return;
        setPending(true);
        setError(null);
        setMessage(null);
        const data = new FormData(event.currentTarget);
        const result = await addDelegateCandidate({
          fullName: String(data.get("fullName") ?? ""),
          studentId: String(data.get("studentId") ?? ""),
          course: String(data.get("course") ?? ""),
        });
        setPending(false);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        setMessage("Delegate candidate added to the Election 1 ballot for that unit.");
        setFormKey((value) => value + 1);
        router.refresh();
      }}
    >
      <h2 className="font-serif text-2xl text-navy">Add a delegate candidate</h2>
      <p className="mt-1 text-sm text-navy/60">
        Nominate another student for Election 1 in a campus, school, and course. They appear
        on that unit’s ballot after you add them.
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="block">
          <span className="text-[10px] tracking-[0.14em] text-navy/40 uppercase">Full name</span>
          <input name="fullName" required disabled={!canAdd} placeholder="Candidate full name" className={fieldClass} />
        </label>
        <label className="block">
          <span className="text-[10px] tracking-[0.14em] text-navy/40 uppercase">Admission number</span>
          <input name="studentId" required disabled={!canAdd} placeholder="24/01299" className={fieldClass} />
        </label>
        <label className="block md:col-span-2">
          <span className="text-[10px] tracking-[0.14em] text-navy/40 uppercase">Electoral unit</span>
          <select name="course" required disabled={!canAdd} defaultValue="" className={fieldClass}>
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
      </div>
      <button
        type="submit"
        disabled={!canAdd || pending}
        title={!canAdd ? disabledReason : undefined}
        className="mt-4 rounded-sm bg-gold px-4 py-2 text-xs font-bold tracking-[0.16em] text-navy uppercase disabled:cursor-not-allowed disabled:opacity-40"
      >
        {pending ? "Adding…" : "Add delegate candidate"}
      </button>
      {!canAdd ? <p className="mt-2 text-xs text-navy/50">{disabledReason}</p> : null}
      {error ? <p className="mt-2 text-xs text-red-700">{error}</p> : null}
      {message ? <p className="mt-2 text-xs text-emerald-800">{message}</p> : null}
    </form>
  );
}
