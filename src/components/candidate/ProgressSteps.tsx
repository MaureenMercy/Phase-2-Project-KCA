import { APPLICATION_STEPS } from "@/lib/candidate-portal";

export function ProgressSteps({ current }: { current: number }) {
  return (
    <ol className="grid gap-2 sm:grid-cols-5" aria-label="Application steps">
      {APPLICATION_STEPS.map((step) => {
        const state =
          step.id < current ? "complete" : step.id === current ? "current" : "upcoming";
        return (
          <li
            key={step.id}
            aria-current={state === "current" ? "step" : undefined}
            className={`rounded-2xl border px-3 py-3 ${
              state === "current"
                ? "border-navy bg-navy text-white"
                : state === "complete"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                  : "border-slate-200 bg-white text-navy/55"
            }`}
          >
            <p className="text-[11px] font-semibold tracking-[0.16em] uppercase">
              Step {step.id}
            </p>
            <p className="mt-1 text-sm font-semibold">{step.label}</p>
            <p className={`mt-1 text-xs ${state === "current" ? "text-white/80" : "text-navy/55"}`}>
              {step.description}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
