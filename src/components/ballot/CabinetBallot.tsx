"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { goToCabinetStep, saveCabinetSelection, submitCabinetVote } from "@/lib/actions/cabinet";
import { CABINET_CONTESTS } from "@/lib/electoral";
import type { CabinetCandidate, CabinetContestId } from "@/lib/types";

export function CabinetBallot({
  step,
  selections,
  candidates,
}: {
  step: number;
  selections: Partial<Record<CabinetContestId, string>>;
  candidates: CabinetCandidate[];
}) {
  const contest = CABINET_CONTESTS[Math.min(step, 5)];
  const options = candidates.filter((candidate) => candidate.contestId === contest.id);
  const selected = selections[contest.id] ?? null;
  const [choice, setChoice] = useState<string | null>(selected);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function next() {
    if (!choice) {
      setError("Select one option to continue. Your vote is not submitted yet.");
      return;
    }
    setPending(true);
    const result = await saveCabinetSelection({
      contestId: contest.id,
      choiceId: choice,
      advance: true,
    });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push(result.next ?? "/vote/ballot");
    router.refresh();
  }

  return (
    <div>
      <p className="text-center text-xs tracking-[0.2em] text-navy/35 uppercase">
        Step {step + 1} of 6
      </p>
      <h2 className="mt-2 text-center font-serif text-3xl text-navy">{contest.title}</h2>
      <p className="mt-1 text-center text-sm text-navy/55">{contest.instruction}</p>

      <ul className="mt-8 space-y-3">
        {options.map((option) =>
          contest.kind === "ticket" ? (
            <li key={option.id}>
              <TicketCard
                option={option}
                selected={choice === option.id}
                onSelect={() => {
                  setChoice(option.id);
                  setError(null);
                }}
              />
            </li>
          ) : (
            <li key={option.id}>
              <OptionCard
                name={option.fullName}
                photo={option.photo}
                selected={choice === option.id}
                onSelect={() => {
                  setChoice(option.id);
                  setError(null);
                }}
              />
            </li>
          ),
        )}
      </ul>

      {error ? <p className="mt-4 text-center text-sm text-red-700">{error}</p> : null}

      <div className="mt-8 flex gap-3">
        {step > 0 ? (
          <button
            type="button"
            className="flex-1 rounded-2xl bg-white py-4 text-sm font-semibold ring-1 ring-black/10"
            onClick={async () => {
              await goToCabinetStep(step - 1);
              router.refresh();
            }}
          >
            Back
          </button>
        ) : null}
        <button
          type="button"
          disabled={pending}
          onClick={() => void next()}
          className="flex-[2] rounded-2xl bg-navy py-4 text-sm font-bold tracking-[0.16em] text-white uppercase"
        >
          {step >= 5 ? "Review" : "Next"}
        </button>
      </div>
      <p className="mt-4 text-center text-xs text-navy/40">
        Next keeps your selection. The vote is not final until you confirm on the last screen.
      </p>
    </div>
  );
}

export function OptionCard({
  name,
  photo,
  selected,
  onSelect,
}: {
  name: string;
  photo: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        "flex w-full items-center gap-4 rounded-[28px] px-5 py-4 text-left transition",
        selected
          ? "bg-navy text-white shadow-lg"
          : "bg-white text-navy ring-1 ring-black/5 hover:ring-navy/20",
      ].join(" ")}
    >
      <img src={photo} alt="" className="h-16 w-16 rounded-full object-cover" />
      <span className="min-w-0 flex-1">
        <span className="block text-lg font-semibold">{name}</span>
        <span className={selected ? "text-sm text-gold" : "text-sm text-navy/45"}>
          {selected ? "Selected" : "Select"}
        </span>
      </span>
      <span
        className={[
          "flex h-6 w-6 items-center justify-center rounded-full border-2",
          selected ? "border-gold bg-gold" : "border-navy/20",
        ].join(" ")}
      >
        {selected ? (
          <span className="h-2.5 w-2.5 rounded-full bg-navy" />
        ) : null}
      </span>
    </button>
  );
}

function TicketCard({
  option,
  selected,
  onSelect,
}: {
  option: CabinetCandidate;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        "w-full rounded-[28px] px-5 py-6 text-left transition",
        selected ? "bg-navy text-white shadow-lg" : "bg-white text-navy ring-1 ring-black/5",
      ].join(" ")}
    >
      {option.ticketLabel ? (
        <p className={`text-[11px] tracking-[0.18em] uppercase ${selected ? "text-gold" : "text-navy/40"}`}>
          {option.ticketLabel}
        </p>
      ) : null}
      <div className="mt-3 flex items-center justify-around gap-3">
        <span className="flex flex-col items-center">
          <img src={option.photo} alt="" className="h-20 w-20 rounded-full object-cover" />
          <span className="mt-2 text-sm font-semibold">{option.fullName}</span>
          <span className={`text-[10px] tracking-[0.16em] uppercase ${selected ? "text-gold" : "text-navy/40"}`}>
            President
          </span>
        </span>
        <span className="text-2xl font-serif">+</span>
        <span className="flex flex-col items-center">
          <img src={option.runningMatePhoto} alt="" className="h-20 w-20 rounded-full object-cover" />
          <span className="mt-2 text-sm font-semibold">{option.runningMateName}</span>
          <span className={`text-[10px] tracking-[0.16em] uppercase ${selected ? "text-gold" : "text-navy/40"}`}>
            Vice President
          </span>
        </span>
      </div>
      <p className="mt-4 text-center text-sm font-semibold">{selected ? "Selected" : "Select ticket"}</p>
    </button>
  );
}

export function CabinetReview({
  selections,
  candidates,
}: {
  selections: Partial<Record<CabinetContestId, string>>;
  candidates: CabinetCandidate[];
}) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="rounded-[28px] bg-white p-6 shadow-sm ring-1 ring-black/5">
      <h2 className="text-center font-serif text-3xl text-navy">Review your vote</h2>
      <p className="mt-2 text-center text-sm text-navy/55">
        Before submitting, review your selections. You may go back and edit.
      </p>
      <ul className="mt-6 space-y-3">
        {CABINET_CONTESTS.map((contest) => {
          const choice = candidates.find((candidate) => candidate.id === selections[contest.id]);
          return (
            <li key={contest.id} className="rounded-2xl bg-[#f3f3f4] px-4 py-3">
              <p className="text-xs tracking-[0.14em] text-navy/40 uppercase">{contest.title}</p>
              <p className="mt-1 font-semibold">
                {choice
                  ? choice.runningMateName
                    ? `${choice.fullName} + ${choice.runningMateName}`
                    : choice.fullName
                  : "Not selected"}
              </p>
            </li>
          );
        })}
      </ul>
      {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}
      <div className="mt-6 grid gap-3">
        <button
          type="button"
          className="rounded-2xl bg-white py-4 text-sm font-semibold ring-1 ring-black/10"
          onClick={async () => {
            await goToCabinetStep(0);
            router.push("/vote/ballot");
          }}
        >
          Go back and edit
        </button>
        <button
          type="button"
          className="rounded-2xl bg-navy py-4 text-sm font-bold tracking-[0.16em] text-white uppercase"
          onClick={() => setConfirm(true)}
        >
          Confirm & submit vote
        </button>
      </div>
      {confirm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-[28px] bg-white p-6 text-center">
            <p className="font-serif text-2xl">Are you sure you want to submit your vote?</p>
            <p className="mt-2 text-sm text-navy/60">Once submitted, your vote cannot be changed.</p>
            <div className="mt-6 flex gap-3">
              <button type="button" className="flex-1 rounded-2xl bg-[#f3f3f4] py-3" onClick={() => setConfirm(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="flex-1 rounded-2xl bg-navy py-3 font-bold text-white"
                onClick={async () => {
                  const result = await submitCabinetVote();
                  if (!result.ok) {
                    setError(result.error);
                    setConfirm(false);
                    return;
                  }
                  router.push("/vote/submitted");
                }}
              >
                Submit final vote
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
