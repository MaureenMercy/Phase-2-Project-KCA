"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  bindAgentInvitation,
  confirmAgentIdentityOtp,
  saveAgentApplicationDraft,
  startAgentIdentityVerification,
  submitAgentApplication,
} from "@/lib/actions/agent-portal";
import { IDENTITY_DOCUMENT_LABELS } from "@/lib/student-identity";
import { Field, fieldClass, primaryButtonClass, secondaryButtonClass } from "@/components/agent/SummaryCard";
import type { IdentityDocumentType } from "@/lib/types";

const STEPS = [
  "Identity verification",
  "Candidate invitation",
  "Academic information",
  "Polling station request",
  "Declaration and submission",
];

type Snapshot = {
  fullName: string;
  campusName: string;
  schoolName: string;
  departmentName: string;
  programme: string;
  nationalIdMasked: string;
};

type InvitationCard = {
  reference: string;
  candidateName: string;
  candidatePosition: string;
  candidatePhoto: string;
  election: string;
};

export function RegisterWizard({
  stations,
  academicByStudent,
  invitationsByStudent,
  initialReference,
}: {
  stations: { id: string; name: string; campus: string; campusId: string }[];
  academicByStudent: Record<string, Snapshot>;
  invitationsByStudent: Record<string, InvitationCard[]>;
  initialReference?: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demoOtp, setDemoOtp] = useState<string | null>(null);
  const [studentId, setStudentId] = useState("");
  const [documentType, setDocumentType] = useState<IdentityDocumentType>("NATIONAL_ID");
  const [nationalId, setNationalId] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [identityReady, setIdentityReady] = useState(false);
  const [invitation, setInvitation] = useState(initialReference ?? "");
  const [invitationReady, setInvitationReady] = useState(false);
  const [stationId, setStationId] = useState(stations[0]?.id ?? "");
  const [correction, setCorrection] = useState("");
  const [conduct, setConduct] = useState(false);
  const [accuracy, setAccuracy] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [reference, setReference] = useState<string | null>(null);

  const snapshot = academicByStudent[studentId.trim().toUpperCase()] ?? academicByStudent[studentId.trim()];
  const invitationCard = useMemo(() => {
    const list = invitationsByStudent[studentId.trim()] ?? invitationsByStudent[studentId.trim().toUpperCase()] ?? [];
    return list.find((item) => item.reference === invitation.trim().toUpperCase()) ?? list[0];
  }, [invitation, invitationsByStudent, studentId]);

  async function run(action: () => Promise<{ ok: boolean; error?: string; demoOtp?: string | null; next?: string }>, onOk?: () => void) {
    setPending(true);
    setError(null);
    const result = await action();
    setPending(false);
    if (!result.ok) {
      setError(result.error ?? "Something went wrong.");
      return;
    }
    if (result.demoOtp) setDemoOtp(result.demoOtp);
    onOk?.();
    if (result.next) router.push(result.next);
  }

  return (
    <div className="rounded-2xl border border-navy/10 bg-white p-6 shadow-[0_12px_40px_rgba(24,43,92,0.06)]">
      <ol className="mb-6 grid grid-cols-5 gap-2" aria-label="Registration progress">
        {STEPS.map((label, index) => (
          <li key={label} className="text-center">
            <span
              className={[
                "mx-auto flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold",
                index === step ? "bg-navy text-cream" : index < step ? "bg-gold text-navy" : "bg-slate-100 text-navy/40",
              ].join(" ")}
            >
              {index + 1}
            </span>
            <p className="mt-2 hidden text-[11px] leading-4 text-navy/55 sm:block">{label}</p>
          </li>
        ))}
      </ol>

      {error ? <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p> : null}
      {demoOtp ? (
        <p className="mb-4 rounded-xl bg-gold/20 px-4 py-3 text-sm text-navy">
          Simulated OTP (DEMO MODE): <strong>{demoOtp}</strong>
        </p>
      ) : null}

      {step === 0 ? (
        <div className="space-y-4">
          <Field label="Student registration number">
            <input className={fieldClass} value={studentId} onChange={(event) => setStudentId(event.target.value)} autoComplete="username" />
          </Field>
          <Field label="Identity document type">
            <select className={fieldClass} value={documentType} onChange={(event) => setDocumentType(event.target.value as IdentityDocumentType)}>
              {Object.entries(IDENTITY_DOCUMENT_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </Field>
          <Field label="National ID or document number" hint="Used only to match the verified student record. It is encrypted and masked after verification.">
            <input className={fieldClass} value={nationalId} onChange={(event) => setNationalId(event.target.value)} />
          </Field>
          <Field label="Mobile phone number">
            <input className={fieldClass} value={phone} onChange={(event) => setPhone(event.target.value)} inputMode="tel" />
          </Field>
          {identityReady && snapshot ? (
            <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm">
              Verified name (read-only): <strong>{snapshot.fullName}</strong>. Identity document {snapshot.nationalIdMasked}.
            </p>
          ) : null}
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className={secondaryButtonClass}
              disabled={pending}
              onClick={() =>
                void run(() =>
                  startAgentIdentityVerification({ studentId, documentType, nationalId, phone }),
                )
              }
            >
              Send OTP
            </button>
            <Field label="One-time code">
              <input className={fieldClass} value={otp} onChange={(event) => setOtp(event.target.value)} inputMode="numeric" />
            </Field>
          </div>
          <button
            type="button"
            className={primaryButtonClass}
            disabled={pending}
            onClick={() =>
              void run(
                () => confirmAgentIdentityOtp({ studentId, otp, phone, documentType, nationalId }),
                () => {
                  setIdentityReady(true);
                  setStep(1);
                },
              )
            }
          >
            Verify identity
          </button>
        </div>
      ) : null}

      {step === 1 ? (
        <div className="space-y-4">
          <Field label="Nomination / invitation reference" hint="The candidate who nominated you must give you this reference. You cannot pick a candidate from a public list.">
            <input className={fieldClass} value={invitation} onChange={(event) => setInvitation(event.target.value)} />
          </Field>
          {invitationReady && invitationCard ? (
            <article className="flex gap-4 rounded-2xl border border-navy/10 p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={invitationCard.candidatePhoto} alt="" className="h-20 w-20 rounded-xl object-cover" />
              <div>
                <p className="text-[10px] tracking-[0.16em] text-navy/40 uppercase">You are applying to represent</p>
                <p className="font-serif text-2xl text-navy">{invitationCard.candidateName}</p>
                <p className="text-sm text-navy/60">{invitationCard.candidatePosition} · {invitationCard.election}</p>
                <p className="mt-1 font-mono text-xs">{invitationCard.reference}</p>
              </div>
            </article>
          ) : null}
          <button
            type="button"
            className={primaryButtonClass}
            disabled={pending}
            onClick={() =>
              void run(
                () => bindAgentInvitation(invitation),
                () => {
                  setInvitationReady(true);
                  setStep(2);
                },
              )
            }
          >
            Link this invitation
          </button>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-3">
          <p>These academic details come from the verified student identity record. You cannot change them here.</p>
          <dl className="grid gap-3 sm:grid-cols-2">
            <ReadOnly label="Campus" value={snapshot?.campusName} />
            <ReadOnly label="School" value={snapshot?.schoolName} />
            <ReadOnly label="Programme / course" value={snapshot?.programme} />
            <ReadOnly label="Academic department" value={snapshot?.departmentName} />
          </dl>
          <Field label="Request a correction if something is wrong">
            <textarea className={fieldClass} rows={3} value={correction} onChange={(event) => setCorrection(event.target.value)} />
          </Field>
          <button type="button" className={primaryButtonClass} onClick={() => setStep(3)}>
            Continue
          </button>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="space-y-4">
          <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-950">
            Requested access is subject to Electoral Commission approval. Selecting a station does not grant you access.
          </p>
          <Field label="Requested campus / polling station">
            <select className={fieldClass} value={stationId} onChange={(event) => setStationId(event.target.value)}>
              {stations.map((station) => (
                <option key={station.id} value={station.id}>
                  {station.campus} · {station.name}
                </option>
              ))}
            </select>
          </Field>
          <button type="button" className={primaryButtonClass} onClick={() => setStep(4)}>
            Continue
          </button>
        </div>
      ) : null}

      {step === 4 ? (
        <div className="space-y-4">
          <ul className="rounded-xl bg-slate-50 p-4 text-sm">
            <li>Applicant: {snapshot?.fullName}</li>
            <li>Student ID: {studentId}</li>
            <li>Candidate: {invitationCard?.candidateName} · {invitationCard?.reference}</li>
            <li>Requested station: {stations.find((item) => item.id === stationId)?.name}</li>
          </ul>
          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" checked={conduct} onChange={(event) => setConduct(event.target.checked)} />
            I have read and accept the Agent Code of Conduct. I will observe only, and I will not interfere with voting or Commission decisions.
          </label>
          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" checked={accuracy} onChange={(event) => setAccuracy(event.target.checked)} />
            I confirm that the information in this application is accurate.
          </label>
          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" checked={privacy} onChange={(event) => setPrivacy(event.target.checked)} />
            I understand that my National ID is encrypted, access-restricted and masked, and is used only for identity matching.
          </label>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className={secondaryButtonClass}
              disabled={pending}
              onClick={() =>
                void run(() => saveAgentApplicationDraft({ requestedStationId: stationId, correctionRequest: correction }))
              }
            >
              Save draft
            </button>
            <button
              type="button"
              className={primaryButtonClass}
              disabled={pending}
              onClick={() =>
                void run(async () => {
                  const result = await submitAgentApplication({
                    requestedStationId: stationId,
                    correctionRequest: correction,
                    conduct,
                    accuracy,
                    privacy,
                  });
                  if (result.ok) setReference("submitted");
                  return result;
                })
              }
            >
              Submit application
            </button>
          </div>
          {reference ? <p className="text-sm text-emerald-800">Application submitted. Opening your dashboard…</p> : null}
        </div>
      ) : null}

      {step > 0 ? (
        <button type="button" className="mt-4 text-xs tracking-wide text-navy/50 uppercase" onClick={() => setStep((value) => value - 1)}>
          Back
        </button>
      ) : null}
    </div>
  );
}

function ReadOnly({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-xl bg-slate-50 px-4 py-3">
      <p className="text-[10px] tracking-[0.16em] text-navy/40 uppercase">{label}</p>
      <p className="mt-1 font-medium text-navy">{value || "—"}</p>
    </div>
  );
}
