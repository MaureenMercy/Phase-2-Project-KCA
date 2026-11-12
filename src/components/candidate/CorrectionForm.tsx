"use client";

import { useState } from "react";
import { requestRecordCorrection } from "@/lib/actions/candidate-portal";
import type { CorrectionRequestFieldKey } from "@/lib/types";

type Option = { id: string; name: string };

export function CorrectionForm({
  applicationId,
  campusId,
  campuses,
  schools,
  departments,
}: {
  applicationId?: string;
  campusId: string;
  campuses: Option[];
  schools: Option[];
  departments: Option[];
}) {
  const [open, setOpen] = useState(false);
  const [field, setField] = useState<CorrectionRequestFieldKey>("fullName");
  const [requestedValue, setRequestedValue] = useState("");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function optionsForField() {
    if (field === "campusId") return campuses;
    if (field === "schoolId") return schools;
    if (field === "departmentId") return departments;
    return null;
  }

  const options = optionsForField();

  return (
    <div className="mt-6 border-t border-slate-200 pt-5">
      <button
        type="button"
        className="text-sm font-semibold text-navy underline-offset-4 hover:underline"
        onClick={() => setOpen((value) => !value)}
      >
        {open ? "Hide correction request" : "Request correction"}
      </button>
      {open ? (
        <form
          className="mt-4 space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            setPending(true);
            setError(null);
            setMessage(null);
            const result = await requestRecordCorrection({
              applicationId,
              field,
              requestedValue,
              reason,
            });
            setPending(false);
            if (!result.ok) {
              setError(result.error);
              return;
            }
            setMessage("Your correction request has been sent. Verified records stay unchanged until the Commission reviews it.");
            setReason("");
            setRequestedValue("");
          }}
        >
          <label className="block text-sm">
            <span className="font-semibold text-navy">What needs to be corrected?</span>
            <select
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-3"
              value={field}
              onChange={(event) => {
                setField(event.target.value as CorrectionRequestFieldKey);
                setRequestedValue("");
              }}
            >
              <option value="fullName">Full name</option>
              <option value="phoneNumber">Mobile number</option>
              <option value="campusId">Campus</option>
              <option value="schoolId">School</option>
              <option value="departmentId">Department</option>
              <option value="programmeLabel">Academic programme</option>
            </select>
          </label>
          {field === "schoolId" ? (
            <p className="text-xs text-navy/60">
              Schools are limited to your current campus ({campuses.find((item) => item.id === campusId)?.name}).
            </p>
          ) : null}
          {field === "departmentId" && departments.length === 0 ? (
            <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-950">
              This campus does not use a department list. Describe the correction in the reason field.
            </p>
          ) : null}
          {options ? (
            <label className="block text-sm">
              <span className="font-semibold text-navy">Requested value</span>
              <select
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-3"
                value={requestedValue}
                onChange={(event) => setRequestedValue(event.target.value)}
                required={field !== "departmentId" || departments.length > 0}
              >
                <option value="">Select from the official list</option>
                {options.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <label className="block text-sm">
              <span className="font-semibold text-navy">Requested value</span>
              <input
                className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-3"
                value={requestedValue}
                onChange={(event) => setRequestedValue(event.target.value)}
                required
              />
            </label>
          )}
          <label className="block text-sm">
            <span className="font-semibold text-navy">Why should this be changed?</span>
            <textarea
              className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-3"
              rows={3}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              required
            />
          </label>
          {error ? (
            <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-800">
              {error}
            </p>
          ) : null}
          {message ? (
            <p role="status" className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              {message}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={pending}
            className="rounded-xl bg-navy px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {pending ? "Sending request…" : "Send correction request"}
          </button>
        </form>
      ) : null}
    </div>
  );
}
