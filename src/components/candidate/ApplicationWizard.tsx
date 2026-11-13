"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { CorrectionForm } from "@/components/candidate/CorrectionForm";
import { FileUploadField } from "@/components/candidate/FileUploadField";
import { ProgressSteps } from "@/components/candidate/ProgressSteps";
import { VerifiedRecordCard } from "@/components/candidate/VerifiedRecordCard";
import {
  saveApplicationProgress,
  submitApplication,
  uploadApplicationFile,
} from "@/lib/actions/candidate-portal";
import {
  applicationWindowState,
  councilPositionById,
  electionTypeLabel,
  jointTicketBlocked,
  openCouncilPositions,
  requiredDocumentsFor,
  canEditApplication,
  statusExplanation,
} from "@/lib/candidate-portal";
import type { PublicStudentIdentity } from "@/lib/identity";
import type {
  CandidatePortalApplication,
  CandidateApplicationType,
  PortalConfig,
} from "@/lib/types";

export function ApplicationWizard({
  application,
  identity,
  config,
  campuses,
  schools,
  departments,
}: {
  application: CandidatePortalApplication;
  identity: PublicStudentIdentity;
  config: PortalConfig;
  campuses: Array<{ id: string; name: string }>;
  schools: Array<{ id: string; name: string }>;
  departments: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const locked = !canEditApplication(application.status);
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(application.currentStep);
  const [type, setType] = useState<CandidateApplicationType | null>(application.applicationType);
  const [positionId, setPositionId] = useState(application.councilPositionId);
  const [declarations, setDeclarations] = useState(application.declarations);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const position = councilPositionById(config, positionId);
  const openPositions = openCouncilPositions(config);
  const requiredDocs = requiredDocumentsFor(config, {
    applicationType: type,
    councilPositionId: positionId,
  });
  const windowState = type
    ? applicationWindowState(config.applicationWindows[type])
    : { open: true as const, reason: null };
  const jointBlocked = jointTicketBlocked(config, position);

  const photoHint = useMemo(() => {
    const types = config.acceptedPhotoTypes.join(", ").replace("image/", "");
    const max = Math.round(config.maxPhotoBytes / (1024 * 1024));
    return `Accepted: ${types}. Maximum ${max} MB.`;
  }, [config]);

  async function persist(nextStep: 1 | 2 | 3 | 4 | 5, extra?: Parameters<typeof saveApplicationProgress>[0]) {
    setPending(true);
    setError(null);
    const result = await saveApplicationProgress({
      applicationId: application.id,
      currentStep: nextStep,
      applicationType: type,
      councilPositionId: positionId,
      declarations,
      ...extra,
    });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return false;
    }
    await router.refresh();
    return true;
  }

  async function goNext() {
    if (step === 2 && !type) {
      setError("Select the election you wish to contest.");
      return;
    }
    if (step === 2 && type && !windowState.open) {
      setError(windowState.reason);
      return;
    }
    if (step === 3 && type === "SAKU_COUNCIL") {
      if (!position) {
        setError("Select a SAKU Council position that is open for applications.");
        return;
      }
      if (jointBlocked) {
        setError(
          "The President / Vice President joint-ticket process is awaiting Electoral Commission configuration.",
        );
        return;
      }
    }
    if (step === 3 && type === "DELEGATE" && application.electoralCollege?.mappingStatus !== "resolved") {
      setError(
        application.electoralCollege?.label ??
          "Your Electoral College is awaiting Electoral Commission configuration.",
      );
      return;
    }
    const next = Math.min(5, step + 1) as 1 | 2 | 3 | 4 | 5;
    if (await persist(next)) setStep(next);
  }

  async function saveLater() {
    if (await persist(step)) {
      setNotice("Draft saved. You can continue this application later from My Applications.");
    }
  }

  return (
    <div className="space-y-6">
      <ProgressSteps current={step} />
      {locked ? (
        <p className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-navy/80">
          This application is {application.status.toLowerCase()}. {statusExplanation(application.status)} You
          cannot change submitted details here.
        </p>
      ) : null}
      {step === 1 ? (
        <VerifiedRecordCard identity={identity}>
          <CorrectionForm
            applicationId={application.id}
            campusId={identity.campusId}
            campuses={campuses}
            schools={schools}
            departments={departments}
          />
        </VerifiedRecordCard>
      ) : null}

      {step === 2 ? (
        <section className="space-y-4">
          <h2 className="font-serif text-2xl text-navy">Select the election you wish to contest</h2>
          <p className="text-sm text-navy/70">
            Choose one election for this application. You may start a separate application for the other
            election if the rules allow it.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <ElectionCard
              selected={type === "DELEGATE"}
              title="Election 1 — Delegates Election"
              body="Apply to represent your applicable Electoral College as a student delegate."
              onSelect={() => {
                setType("DELEGATE");
                setPositionId(null);
              }}
            />
            <ElectionCard
              selected={type === "SAKU_COUNCIL"}
              title="Election 2 — SAKU Council Election"
              body="Apply to contest an approved SAKU Council leadership position."
              onSelect={() => setType("SAKU_COUNCIL")}
            />
          </div>
        </section>
      ) : null}

      {step === 3 && type === "DELEGATE" ? (
        <section className="candidate-card space-y-4 p-6">
          <h2 className="font-serif text-2xl text-navy">Delegate application details</h2>
          <p className="text-sm text-navy/70">
            Your Electoral College is taken from your verified campus, school and department. You cannot
            choose a different unit.
          </p>
          <ReadOnlyRow label="Campus" value={identity.campusName} />
          <ReadOnlyRow label="School" value={identity.schoolName} />
          <ReadOnlyRow label="Programme / department" value={identity.programmeLabel} />
          {application.electoralCollege?.mappingStatus === "resolved" ? (
            <div className="rounded-2xl bg-navy px-4 py-4 text-white">
              <p className="text-[11px] tracking-[0.16em] text-gold uppercase">Electoral College</p>
              <p className="mt-1 text-lg font-semibold">{application.electoralCollege.label}</p>
            </div>
          ) : (
            <div className="rounded-2xl bg-amber-50 px-4 py-4 text-amber-950">
              <p className="font-semibold">Awaiting Commission configuration</p>
              <p className="mt-1 text-sm">
                {application.electoralCollege?.label ??
                  "The Electoral College for this record has not been configured. This application cannot be completed yet."}
              </p>
            </div>
          )}
        </section>
      ) : null}

      {step === 3 && type === "SAKU_COUNCIL" ? (
        <section className="candidate-card space-y-4 p-6">
          <h2 className="font-serif text-2xl text-navy">SAKU Council application details</h2>
          <ReadOnlyRow label="Campus" value={identity.campusName} />
          <ReadOnlyRow label="School" value={identity.schoolName} />
          <ReadOnlyRow label="Programme / department" value={identity.programmeLabel} />
          <fieldset>
            <legend className="text-sm font-semibold text-navy">Position</legend>
            <p className="mt-1 text-sm text-navy/70">
              Only positions currently open for applications are listed.
            </p>
            <div className="mt-3 space-y-3">
              {openPositions.map((item) => (
                <label
                  key={item.id}
                  className={`block rounded-2xl border p-4 ${
                    positionId === item.id ? "border-navy bg-navy/5" : "border-slate-200"
                  }`}
                >
                  <input
                    type="radio"
                    name="councilPosition"
                    className="mr-2 accent-navy"
                    checked={positionId === item.id}
                    onChange={() => setPositionId(item.id)}
                  />
                  <span className="font-semibold text-navy">{item.title}</span>
                  {item.jointTicket ? (
                    <span className="ml-2 text-xs text-amber-800">Joint ticket</span>
                  ) : null}
                </label>
              ))}
            </div>
          </fieldset>
          {position ? (
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm font-semibold text-navy">Eligibility for this position</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-navy/75">
                {position.eligibilitySummary.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <p className="mt-3 text-sm font-semibold text-navy">Required documents</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-navy/75">
                <li>Candidate photograph</li>
                {position.requiredDocuments.map((item) => (
                  <li key={item.id}>{item.label}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {jointBlocked ? (
            <div className="rounded-2xl bg-amber-50 px-4 py-4 text-amber-950">
              <p className="font-semibold">Joint-ticket workflow unavailable</p>
              <p className="mt-1 text-sm">
                The approved President / Vice President joint-ticket arrangement is recognised, but the
                registration process has not been configured by the Electoral Commission. Choose another
                open position, or wait for that configuration.
              </p>
            </div>
          ) : null}
        </section>
      ) : null}

      {step === 3 && !type ? (
        <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Select an election first. The details for the other election will not be shown.
        </p>
      ) : null}

      {step === 4 ? (
        <section className="space-y-4">
          <h2 className="font-serif text-2xl text-navy">Photograph, documents and declarations</h2>
          <FileUploadField
            label="Candidate photograph"
            hint={photoHint}
            accept={config.acceptedPhotoTypes.join(",")}
            currentName={application.photograph?.filename}
            disabled={locked}
            onFile={async (file) => {
              const result = await uploadApplicationFile({
                applicationId: application.id,
                kind: "photograph",
                ...file,
              });
              if (!result.ok) throw new Error(result.error);
              router.refresh();
            }}
          />
          {requiredDocs.map((doc) => (
            <FileUploadField
              key={doc.id}
              label={doc.label}
              hint={`Accepted: JPEG, PNG or PDF. Maximum ${Math.round(config.maxDocumentBytes / (1024 * 1024))} MB.`}
              accept={config.acceptedDocumentTypes.join(",")}
              currentName={application.documents.find((item) => item.kind === doc.id)?.filename}
              disabled={locked}
              onFile={async (file) => {
                const result = await uploadApplicationFile({
                  applicationId: application.id,
                  kind: doc.id,
                  ...file,
                });
                if (!result.ok) throw new Error(result.error);
                router.refresh();
              }}
            />
          ))}
          <fieldset className="candidate-card space-y-3 p-5">
            <legend className="text-sm font-semibold text-navy">Declarations</legend>
            <Declaration
              checked={declarations.informationAccurate}
              onChange={(value) =>
                setDeclarations((current) => ({ ...current, informationAccurate: value }))
              }
              label="I confirm that the information in this application is true."
            />
            <Declaration
              checked={declarations.understandNotApproval}
              onChange={(value) =>
                setDeclarations((current) => ({ ...current, understandNotApproval: value }))
              }
              label="I understand that sending this application is not the same as being approved."
            />
            <Declaration
              checked={declarations.consentToProcessIdentity}
              onChange={(value) =>
                setDeclarations((current) => ({ ...current, consentToProcessIdentity: value }))
              }
              label="I agree that my student identity details may be used to process this application. National ID information is kept confidential."
            />
            <Declaration
              checked={declarations.acceptCandidateDeclaration}
              onChange={(value) =>
                setDeclarations((current) => ({ ...current, acceptCandidateDeclaration: value }))
              }
              label="I accept the candidate declaration and will follow the election rules issued by the Electoral Commission."
            />
          </fieldset>
        </section>
      ) : null}

      {step === 5 ? (
        <section className="candidate-card space-y-4 p-6">
          <h2 className="font-serif text-2xl text-navy">Review and send</h2>
          <ReadOnlyRow label="Student" value={`${identity.fullName} · ${identity.studentId}`} />
          <ReadOnlyRow label="National ID" value={identity.nationalIdMasked} />
          <ReadOnlyRow label="Election" value={electionTypeLabel(type)} />
          <ReadOnlyRow label="Campus" value={identity.campusName} />
          <ReadOnlyRow label="School" value={identity.schoolName} />
          <ReadOnlyRow label="Programme / department" value={identity.programmeLabel} />
          {type === "DELEGATE" ? (
            <ReadOnlyRow
              label="Electoral College"
              value={application.electoralCollege?.label ?? "Not configured"}
            />
          ) : (
            <ReadOnlyRow label="Council position" value={position?.title ?? "Not selected"} />
          )}
          <ReadOnlyRow
            label="Photograph"
            value={application.photograph ? application.photograph.filename : "Not uploaded"}
          />
          <ReadOnlyRow
            label="Documents"
            value={
              application.documents.length
                ? application.documents.map((item) => item.filename).join(", ")
                : "None uploaded"
            }
          />
          <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-navy/75">
            Sending this form creates an application for review. It does not approve you as a candidate
            and does not place you on a ballot.
          </p>
        </section>
      ) : null}

      {error ? (
        <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p role="status" className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {notice}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        {step > 1 ? (
          <button
            type="button"
            className="rounded-xl border border-navy px-4 py-3 text-sm font-semibold text-navy"
            onClick={() => setStep((current) => (current - 1) as 1 | 2 | 3 | 4 | 5)}
          >
            Back
          </button>
        ) : null}
        {!locked ? (
          <button
            type="button"
            className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-navy"
            onClick={() => void saveLater()}
            disabled={pending}
          >
            Save draft and continue later
          </button>
        ) : null}
        {step < 5 ? (
          <button
            type="button"
            className="rounded-xl bg-navy px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
            onClick={() => void goNext()}
            disabled={pending}
          >
            {pending ? "Saving…" : "Continue"}
          </button>
        ) : (
          <button
            type="button"
            className="rounded-xl bg-navy px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
            disabled={pending || locked}
            onClick={async () => {
              setPending(true);
              setError(null);
              await persist(5);
              const result = await submitApplication(application.id);
              setPending(false);
              if (!result.ok) {
                setError(result.error);
                return;
              }
              window.location.assign(result.next ?? "/candidate/applications");
            }}
          >
            {pending ? "Sending…" : "Send application"}
          </button>
        )}
      </div>
    </div>
  );
}

function ElectionCard({
  selected,
  title,
  body,
  onSelect,
}: {
  selected: boolean;
  title: string;
  body: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`rounded-3xl border p-6 text-left ${
        selected ? "border-navy bg-navy text-white" : "border-slate-200 bg-white text-navy"
      }`}
    >
      <p className="font-serif text-2xl">{title}</p>
      <p className={`mt-3 text-sm leading-6 ${selected ? "text-white/80" : "text-navy/70"}`}>{body}</p>
    </button>
  );
}

function ReadOnlyRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold tracking-wide text-navy/50 uppercase">{label}</p>
      <p className="mt-1 text-base text-navy">{value}</p>
    </div>
  );
}

function Declaration({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-start gap-3 text-sm text-navy">
      <input
        type="checkbox"
        className="mt-1 accent-navy"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}
