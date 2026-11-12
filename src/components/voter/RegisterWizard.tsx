"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AccessibilityForm } from "@/components/voter/AccessibilityForm";
import { CorrectionForm } from "@/components/voter/CorrectionForm";
import {
  requestPhoneOtp,
  saveRegistrationDraft,
  submitVoterRegistration,
  verifyStudentIdentity,
  verifyVoterPhone,
} from "@/lib/actions/voter-portal";
import { maskNationalId, maskPhone } from "@/lib/identity";
import type { AccessibilityProfile, IdentityDocumentPolicy } from "@/lib/types";
import { REGISTRATION_STEPS } from "@/lib/voter";

const field =
  "w-full rounded-xl border border-navy/15 bg-white px-3 py-3 text-sm text-navy";

export type WizardSnapshot = {
  step: number;
  submitted: boolean;
  studentId: string;
  fullName: string | null;
  phoneNumber: string;
  phoneVerified: boolean;
  nationalIdLast4: string;
  campusName: string;
  schoolName: string;
  departmentName: string | null;
  programmeName: string | null;
  programmePending: boolean;
  unitLabel: string | null;
  unitPending: boolean;
  documentPolicy: IdentityDocumentPolicy;
  accessibility: AccessibilityProfile;
  campuses: { id: string; name: string }[];
  schools: { id: string; name: string; campusId: string }[];
  departments: { id: string; name: string; schoolId: string }[];
  programmes: { id: string; name: string; schoolId: string; departmentId: string | null }[];
};

export function RegisterWizard({ snapshot }: { snapshot: WizardSnapshot }) {
  const router = useRouter();
  const [step, setStep] = useState(snapshot.submitted ? 5 : snapshot.step);
  const enabledTypes = snapshot.documentPolicy.allowedTypes.filter((item) => item.enabled);

  return (
    <div className="space-y-6">
      <ol className="grid gap-2 md:grid-cols-5" aria-label="Registration progress">
        {REGISTRATION_STEPS.map((item) => {
          const current = item.id === step;
          const done = item.id < step;
          return (
            <li
              key={item.id}
              className={[
                "rounded-2xl border px-3 py-3 text-sm",
                current ? "border-navy bg-navy text-cream" : done ? "border-gold bg-gold/20 text-navy" : "border-navy/10 bg-white text-navy/60",
              ].join(" ")}
              aria-current={current ? "step" : undefined}
            >
              <span className="block text-[10px] tracking-[0.16em] uppercase">Step {item.id}</span>
              <span className="mt-1 block font-semibold">{item.title}</span>
            </li>
          );
        })}
      </ol>

      {step === 1 ? (
        <IdentityStep
          policyNote={snapshot.documentPolicy.pendingPolicyNote}
          enabledTypes={enabledTypes}
          defaultStudentId={snapshot.studentId}
          onDone={() => {
            setStep(2);
            router.refresh();
          }}
        />
      ) : null}
      {step === 2 ? (
        <PhoneStep
          phoneNumber={snapshot.phoneNumber}
          verified={snapshot.phoneVerified}
          onBack={() => setStep(1)}
          onDone={() => {
            setStep(3);
            router.refresh();
          }}
        />
      ) : null}
      {step === 3 ? (
        <AcademicStep
          snapshot={snapshot}
          onBack={() => setStep(2)}
          onNext={() => setStep(4)}
        />
      ) : null}
      {step === 4 ? (
        <section className="rounded-2xl border border-navy/10 bg-white p-6">
          <h2 className="font-serif text-2xl text-navy">Accessibility & Voting Assistance</h2>
          <p className="mt-2 text-sm text-navy/55">This step is optional and does not affect approval or your right to use accessibility features.</p>
          <div className="mt-4">
            <AccessibilityForm initial={snapshot.accessibility} submitLabel="Save and continue" />
          </div>
          <WizardNav
            onBack={() => setStep(3)}
            onNext={() => setStep(5)}
            nextLabel="Skip or continue"
          />
        </section>
      ) : null}
      {step === 5 ? <ReviewStep snapshot={snapshot} onBack={() => setStep(4)} /> : null}
    </div>
  );
}

function IdentityStep({
  enabledTypes,
  policyNote,
  defaultStudentId,
  onDone,
}: {
  enabledTypes: { id: string; label: string }[];
  policyNote: string;
  defaultStudentId: string;
  onDone: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <form
      className="space-y-4 rounded-2xl border border-navy/10 bg-white p-6"
      onSubmit={async (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        setPending(true);
        setError(null);
        const result = await verifyStudentIdentity({
          studentId: String(data.get("studentId") ?? ""),
          documentType: String(data.get("documentType") ?? "NATIONAL_ID"),
          nationalId: String(data.get("nationalId") ?? ""),
        });
        setPending(false);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        onDone();
      }}
    >
      <h2 className="font-serif text-2xl text-navy">Student identity</h2>
      <p className="text-sm text-navy/65">
        Enter the registration number on your student ID. We retrieve your name from the shared student record. We do not create a new student record if the number is unknown.
      </p>
      <label className="block text-sm font-semibold text-navy">
        Student ID / Registration Number
        <input name="studentId" defaultValue={defaultStudentId} autoComplete="username" required className={`${field} mt-1`} />
      </label>
      <label className="block text-sm font-semibold text-navy">
        Identity document type
        <select name="documentType" className={`${field} mt-1`} defaultValue={enabledTypes[0]?.id}>
          {enabledTypes.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
      <p className="text-xs leading-5 text-navy/50">{policyNote}</p>
      <label className="block text-sm font-semibold text-navy">
        National ID number
        <input name="nationalId" inputMode="numeric" required className={`${field} mt-1`} aria-describedby="nid-help" />
      </label>
      <p id="nid-help" className="text-xs text-navy/50">
        DEMO MODE: use 3 plus the digits of your student ID, for example 24/01204 uses 32401204. The number is encrypted and masked after matching.
      </p>
      {error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">{error}</p> : null}
      <button
        type="submit"
        disabled={pending || enabledTypes.length === 0}
        className="min-h-11 rounded-sm bg-navy px-5 py-2.5 text-xs font-bold tracking-[0.16em] text-cream uppercase disabled:opacity-50"
      >
        {pending ? "Checking…" : "Look up my record"}
      </button>
    </form>
  );
}

function PhoneStep({
  phoneNumber,
  verified,
  onBack,
  onDone,
}: {
  phoneNumber: string;
  verified: boolean;
  onBack: () => void;
  onDone: () => void;
}) {
  const [phone, setPhone] = useState(phoneNumber);
  const [code, setCode] = useState("");
  const [demoOtp, setDemoOtp] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(verified ? "This number is already verified." : null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <section className="space-y-4 rounded-2xl border border-navy/10 bg-white p-6">
      <h2 className="font-serif text-2xl text-navy">Phone verification</h2>
      <p className="text-sm text-navy/65">
        Confirm the mobile number we should use for election notices. In DEMO MODE a simulated OTP is shown on this screen. No SMS is sent.
      </p>
      <label className="block text-sm font-semibold text-navy">
        Mobile number
        <input value={phone} onChange={(event) => setPhone(event.target.value)} className={`${field} mt-1`} inputMode="tel" />
      </label>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className="min-h-11 rounded-sm bg-navy px-4 py-2 text-xs font-bold tracking-[0.16em] text-cream uppercase"
          onClick={async () => {
            setPending(true);
            setError(null);
            const result = await requestPhoneOtp({ phoneNumber: phone });
            setPending(false);
            if (!result.ok) {
              setError(result.error);
              return;
            }
            setDemoOtp(result.demoOtp ?? null);
            setMessage("A demonstration code was issued. It expires in five minutes and is not stored as a password.");
          }}
        >
          {pending ? "Requesting…" : demoOtp ? "Request another code" : "Request code"}
        </button>
      </div>
      {demoOtp ? (
        <p className="rounded-xl bg-gold/20 px-3 py-2 text-sm text-navy">
          Demo code: <span className="font-mono tracking-[0.3em]">{demoOtp}</span>
        </p>
      ) : (
        <p className="text-sm text-navy/55">Request a code, enter it below, then verify. You may request another code if this one expires.</p>
      )}
      <label className="block text-sm font-semibold text-navy">
        6-digit code
        <input value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} className={`${field} mt-1`} inputMode="numeric" aria-label="One-time passcode" />
      </label>
      {error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">{error}</p> : null}
      {message ? <p className="text-sm text-navy/70" role="status">{message}</p> : null}
      <div className="flex flex-wrap gap-3">
        <button type="button" className="min-h-11 rounded-sm border border-navy/20 px-4 py-2 text-xs font-bold tracking-[0.16em] text-navy uppercase" onClick={onBack}>
          Back
        </button>
        <button
          type="button"
          className="min-h-11 rounded-sm bg-gold px-4 py-2 text-xs font-bold tracking-[0.16em] text-navy uppercase"
          onClick={async () => {
            if (verified) {
              onDone();
              return;
            }
            const result = await verifyVoterPhone({ code, phoneNumber: phone });
            if (!result.ok) {
              setError(result.error);
              return;
            }
            onDone();
          }}
        >
          Verify code
        </button>
      </div>
    </section>
  );
}

function AcademicStep({
  snapshot,
  onBack,
  onNext,
}: {
  snapshot: WizardSnapshot;
  onBack: () => void;
  onNext: () => void;
}) {
  const [showCorrection, setShowCorrection] = useState(false);
  return (
    <section className="space-y-4">
      <article className="rounded-2xl border border-navy/10 bg-white p-6">
        <h2 className="font-serif text-2xl text-navy">Academic information review</h2>
        <p className="mt-2 text-sm text-navy/65">
          These fields come from the shared student record. You cannot type a different campus, school or Electoral College here.
        </p>
        <dl className="mt-4 grid gap-3 md:grid-cols-2">
          <Fact label="Full name" value={snapshot.fullName ?? "Retrieved after identity match"} />
          <Fact label="Campus" value={snapshot.campusName} />
          <Fact label="School" value={snapshot.schoolName} />
          <Fact label="Department" value={snapshot.departmentName ?? "Not mapped at this campus"} />
          <Fact
            label="Programme / course"
            value={snapshot.programmePending ? "Pending configuration" : snapshot.programmeName ?? "Pending configuration"}
          />
          <Fact
            label="Electoral unit"
            value={snapshot.unitPending ? "Pending authorized mapping" : snapshot.unitLabel ?? "Pending authorized mapping"}
          />
        </dl>
        {snapshot.unitPending ? (
          <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-950">
            Your Electoral College cannot be derived from the approved academic mapping yet. The record will be referred for authorized review. You cannot choose an unrelated college.
          </p>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" className="min-h-11 rounded-sm border border-navy/20 px-4 py-2 text-xs font-bold tracking-[0.16em] text-navy uppercase" onClick={() => setShowCorrection((value) => !value)}>
            Request Correction
          </button>
          <button
            type="button"
            className="min-h-11 rounded-sm border border-navy/20 px-4 py-2 text-xs font-bold tracking-[0.16em] text-navy uppercase"
            onClick={async () => {
              await saveRegistrationDraft({ step: 3 });
            }}
          >
            Save and continue later
          </button>
        </div>
        <WizardNav onBack={onBack} onNext={onNext} />
      </article>
      {showCorrection ? (
        <CorrectionForm
          campuses={snapshot.campuses}
          schools={snapshot.schools}
          departments={snapshot.departments}
          programmes={snapshot.programmes}
        />
      ) : null}
    </section>
  );
}

function ReviewStep({ snapshot, onBack }: { snapshot: WizardSnapshot; onBack: () => void }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const a11y = useMemo(() => {
    if (!snapshot.accessibility.declared) return "None declared (optional)";
    return `${snapshot.accessibility.categories.join(", ") || "Declared"}. Consent to share with station staff: ${snapshot.accessibility.consentToShareOperationally ? "yes" : "no"}.`;
  }, [snapshot.accessibility]);

  return (
    <section className="space-y-4 rounded-2xl border border-navy/10 bg-white p-6">
      <h2 className="font-serif text-2xl text-navy">Review and submit</h2>
      <p className="text-sm text-navy/65">
        Submitting this form does not make you an approved eligible elector. The Commission still verifies your record.
      </p>
      <dl className="grid gap-3 md:grid-cols-2">
        <Fact label="Student" value={`${snapshot.fullName ?? ""} · ${snapshot.studentId}`} />
        <Fact label="National ID" value={maskNationalId(snapshot.nationalIdLast4)} />
        <Fact label="Phone" value={snapshot.phoneVerified ? `${maskPhone(snapshot.phoneNumber)} (verified)` : "Not verified"} />
        <Fact label="Campus / school" value={`${snapshot.campusName} · ${snapshot.schoolName}`} />
        <Fact label="Department" value={snapshot.departmentName ?? "Not mapped"} />
        <Fact label="Electoral unit" value={snapshot.unitPending ? "Pending configuration" : snapshot.unitLabel ?? "Pending configuration"} />
        <Fact label="Accessibility" value={a11y} />
        <Fact label="Declarations" value="I confirm the details match my student record and I understand voting happens at a campus polling station." />
      </dl>
      {error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">{error}</p> : null}
      <div className="flex flex-wrap gap-3">
        <button type="button" className="min-h-11 rounded-sm border border-navy/20 px-4 py-2 text-xs font-bold tracking-[0.16em] text-navy uppercase" onClick={onBack}>
          Back
        </button>
        <button
          type="button"
          disabled={pending}
          className="min-h-11 rounded-sm bg-gold px-5 py-2.5 text-xs font-bold tracking-[0.16em] text-navy uppercase disabled:opacity-50"
          onClick={async () => {
            setPending(true);
            const result = await submitVoterRegistration();
            setPending(false);
            if (!result.ok) {
              setError(result.error);
              if (result.next) router.push(result.next);
              return;
            }
            router.push(result.next ?? "/voter/home");
          }}
        >
          {pending ? "Submitting…" : "Submit registration"}
        </button>
      </div>
    </section>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-cream/80 px-3 py-3">
      <dt className="text-[10px] tracking-[0.16em] text-navy/45 uppercase">{label}</dt>
      <dd className="mt-1 text-sm text-navy">{value}</dd>
    </div>
  );
}

function WizardNav({
  onBack,
  onNext,
  nextLabel = "Continue",
}: {
  onBack: () => void;
  onNext: () => void;
  nextLabel?: string;
}) {
  return (
    <div className="mt-6 flex flex-wrap gap-3">
      <button type="button" className="min-h-11 rounded-sm border border-navy/20 px-4 py-2 text-xs font-bold tracking-[0.16em] text-navy uppercase" onClick={onBack}>
        Back
      </button>
      <button type="button" className="min-h-11 rounded-sm bg-navy px-4 py-2 text-xs font-bold tracking-[0.16em] text-cream uppercase" onClick={onNext}>
        {nextLabel}
      </button>
    </div>
  );
}
