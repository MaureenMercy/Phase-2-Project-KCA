"use client";

import { useState } from "react";
import { startCandidateVerification } from "@/lib/actions/candidate-portal";
import type { IdentityDocumentType } from "@/lib/types";

export function IdentityForm({
  documentTypes,
  alternativePolicyPending,
  demoAccounts,
}: {
  documentTypes: IdentityDocumentType[];
  alternativePolicyPending: boolean;
  demoAccounts: Array<{
    studentId: string;
    fullName: string;
    nationalId: string;
    phone: string;
    note: string | null;
  }>;
}) {
  const enabled = documentTypes.filter((item) => item.enabled);
  const [studentId, setStudentId] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [phone, setPhone] = useState("");
  const [identityDocumentType, setIdentityDocumentType] = useState(enabled[0]?.id ?? "national_id");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const result = await startCandidateVerification({
      studentId,
      nationalId,
      phone,
      identityDocumentType,
    });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    window.location.assign(result.next ?? "/candidate/verify/otp");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <label className="block">
        <span className="text-sm font-semibold text-navy">Student registration number</span>
        <input
          value={studentId}
          onChange={(event) => setStudentId(event.target.value)}
          autoComplete="username"
          inputMode="text"
          placeholder="24/01212"
          aria-describedby="student-id-help"
          className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
          required
        />
        <span id="student-id-help" className="mt-1 block text-xs text-navy/55">
          Example: 24/01212
        </span>
      </label>
      <label className="block">
        <span className="text-sm font-semibold text-navy">Identity document</span>
        <select
          value={identityDocumentType}
          onChange={(event) => setIdentityDocumentType(event.target.value)}
          className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
        >
          {enabled.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
      {alternativePolicyPending ? (
        <p className="rounded-xl bg-slate-100 px-3 py-2 text-sm text-navy/70">
          Other identity documents are awaiting Electoral Commission configuration. Do not use a
          document that has not been approved.
        </p>
      ) : null}
      <label className="block">
        <span className="text-sm font-semibold text-navy">National ID number</span>
        <input
          value={nationalId}
          onChange={(event) => setNationalId(event.target.value)}
          inputMode="numeric"
          autoComplete="off"
          className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
          required
        />
        <span className="mt-1 block text-xs text-navy/55">
          Use the number on the mock student record. It is used only to match your identity.
        </span>
      </label>
      <label className="block">
        <span className="text-sm font-semibold text-navy">Mobile number</span>
        <input
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          inputMode="tel"
          autoComplete="tel"
          placeholder="0702401212"
          className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
          required
        />
      </label>
      {error ? (
        <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-navy py-3.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Checking your details…" : "Send a one-time code"}
      </button>
      <button
        type="button"
        className="w-full text-sm text-navy/70 underline-offset-4 hover:underline"
        onClick={() => setShowDemo((value) => !value)}
      >
        {showDemo ? "Hide demonstration students" : "Show demonstration students"}
      </button>
      {showDemo ? (
        <ul className="space-y-2 rounded-xl bg-slate-50 p-4 text-sm">
          {demoAccounts
            .filter((item) => item.note)
            .map((item) => (
              <li key={item.studentId}>
                <button
                  type="button"
                  className="w-full rounded-lg px-2 py-2 text-left hover:bg-white"
                  onClick={() => {
                    setStudentId(item.studentId);
                    setNationalId(item.nationalId);
                    setPhone(item.phone);
                  }}
                >
                  <span className="font-semibold text-navy">{item.fullName}</span>
                  <span className="mt-1 block font-mono text-xs text-navy/70">
                    {item.studentId} · ID {item.nationalId} · {item.phone}
                  </span>
                  <span className="block text-xs text-navy/55">{item.note}</span>
                </button>
              </li>
            ))}
        </ul>
      ) : null}
    </form>
  );
}
