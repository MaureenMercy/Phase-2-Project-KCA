"use client";

import { useMemo, useState } from "react";
import { requestAcademicCorrection } from "@/lib/actions/voter-portal";

const field =
  "w-full rounded-xl border border-navy/15 bg-white px-3 py-3 text-sm text-navy";

type Option = { id: string; name: string };

export function CorrectionForm({
  campuses,
  schools,
  departments,
  programmes,
}: {
  campuses: Option[];
  schools: { id: string; name: string; campusId: string }[];
  departments: { id: string; name: string; schoolId: string }[];
  programmes: { id: string; name: string; schoolId: string; departmentId: string | null }[];
}) {
  const [campusId, setCampusId] = useState(campuses[0]?.id ?? "");
  const [schoolId, setSchoolId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [programmeId, setProgrammeId] = useState("");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const schoolOptions = useMemo(
    () => schools.filter((item) => item.campusId === campusId),
    [schools, campusId],
  );
  const departmentOptions = useMemo(
    () => departments.filter((item) => item.schoolId === schoolId),
    [departments, schoolId],
  );
  const programmeOptions = useMemo(
    () =>
      programmes.filter(
        (item) => item.schoolId === schoolId && (item.departmentId ?? "") === (departmentId || ""),
      ),
    [programmes, schoolId, departmentId],
  );

  return (
    <form
      className="space-y-3 rounded-2xl border border-navy/10 bg-white p-5"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        setMessage(null);
        const result = await requestAcademicCorrection({
          reason,
          proposedCampusId: campusId,
          proposedSchoolId: schoolId,
          proposedDepartmentId: departmentId || undefined,
          proposedProgrammeId: programmeId || undefined,
        });
        setPending(false);
        setMessage(result.ok ? "Correction request sent for authorized review. Your verified record was not changed." : result.error);
      }}
    >
      <h3 className="font-serif text-xl text-navy">Request Correction</h3>
      <p className="text-sm text-navy/60">
        You cannot edit verified academic information. Choose campus, then school, then department. Unrelated departments are not listed.
      </p>
      <label className="block text-sm font-semibold text-navy">
        Campus
        <select
          className={`${field} mt-1`}
          value={campusId}
          onChange={(event) => {
            setCampusId(event.target.value);
            setSchoolId("");
            setDepartmentId("");
            setProgrammeId("");
          }}
        >
          {campuses.map((campus) => (
            <option key={campus.id} value={campus.id}>
              {campus.name}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-semibold text-navy">
        School
        <select
          className={`${field} mt-1`}
          value={schoolId}
          onChange={(event) => {
            setSchoolId(event.target.value);
            setDepartmentId("");
            setProgrammeId("");
          }}
        >
          <option value="">Select school</option>
          {schoolOptions.map((school) => (
            <option key={school.id} value={school.id}>
              {school.name}
            </option>
          ))}
        </select>
      </label>
      {departmentOptions.length > 0 ? (
        <label className="block text-sm font-semibold text-navy">
          Department
          <select
            className={`${field} mt-1`}
            value={departmentId}
            onChange={(event) => {
              setDepartmentId(event.target.value);
              setProgrammeId("");
            }}
          >
            <option value="">Select department</option>
            {departmentOptions.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>
        </label>
      ) : schoolId ? (
        <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
          No department mapping is configured for this school. The request will be referred for authorized review. Missing mappings are not guessed.
        </p>
      ) : null}
      {programmeOptions.length > 0 ? (
        <label className="block text-sm font-semibold text-navy">
          Programme / course
          <select className={`${field} mt-1`} value={programmeId} onChange={(event) => setProgrammeId(event.target.value)}>
            <option value="">Select programme</option>
            {programmeOptions.map((programme) => (
              <option key={programme.id} value={programme.id}>
                {programme.name}
              </option>
            ))}
          </select>
        </label>
      ) : schoolId ? (
        <p className="text-sm text-navy/55">Programme / course mapping is pending configuration for this selection.</p>
      ) : null}
      <label className="block text-sm font-semibold text-navy">
        What needs to be corrected?
        <textarea className={`${field} mt-1`} rows={3} value={reason} onChange={(event) => setReason(event.target.value)} required />
      </label>
      {message ? <p className="text-sm text-navy/70" role="status">{message}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="min-h-11 rounded-sm bg-navy px-4 py-2 text-xs font-bold tracking-[0.16em] text-cream uppercase disabled:opacity-50"
      >
        {pending ? "Sending…" : "Send correction request"}
      </button>
    </form>
  );
}
