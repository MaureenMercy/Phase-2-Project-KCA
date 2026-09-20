"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { completeAuthorization } from "@/lib/actions/auth";
import type { PipelineStep } from "@/lib/types";

export function AuthorizeGate() {
  const router = useRouter();
  const [visibleCount, setVisibleCount] = useState(0);
  const [steps, setSteps] = useState<PipelineStep[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [granted, setGranted] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const decision = await completeAuthorization();
      if (cancelled) return;

      if ("alreadyAuthorized" in decision && decision.alreadyAuthorized) {
        router.replace("/commission/dashboard");
        return;
      }

      setSteps(decision.steps);
      setGranted(decision.granted);
      if (!decision.granted) setError(decision.reason);
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    if (steps.length === 0) return;
    const timer = window.setInterval(() => {
      setVisibleCount((count) => {
        if (count >= steps.length) {
          window.clearInterval(timer);
          return count;
        }
        return count + 1;
      });
    }, 420);
    return () => window.clearInterval(timer);
  }, [steps]);

  useEffect(() => {
    if (steps.length === 0 || visibleCount < steps.length || granted === null) {
      return;
    }
    const timeout = window.setTimeout(() => {
      router.replace(granted ? "/commission/dashboard" : "/commission/denied");
    }, 900);
    return () => window.clearTimeout(timeout);
  }, [granted, router, steps.length, visibleCount]);

  return (
    <div className="mt-8 space-y-3 text-left">
      {steps.length === 0 ? (
        <p className="text-sm tracking-[0.18em] text-gold uppercase">
          Establishing authority…
        </p>
      ) : null}

      {steps.slice(0, visibleCount).map((step, index) => (
        <div
          key={step.key}
          className="pipeline-step rounded-sm border border-gold/20 bg-navy-deep/50 px-4 py-3"
          style={{ animationDelay: `${index * 40}ms` }}
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs tracking-[0.16em] text-gold uppercase">
              {step.label}
            </p>
            <StatusMark status={step.status} />
          </div>
          <p className="mt-1 text-sm text-cream/80">{step.detail}</p>
        </div>
      ))}

      {error && visibleCount >= steps.length ? (
        <p className="rounded-sm border border-red-300/40 bg-red-950/40 px-3 py-2 text-sm text-red-100">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function StatusMark({ status }: { status: PipelineStep["status"] }) {
  if (status === "fail") {
    return <span className="text-xs font-bold tracking-wider text-red-200">DENIED</span>;
  }
  if (status === "info") {
    return <span className="text-xs font-bold tracking-wider text-gold">NOTED</span>;
  }
  return <span className="text-xs font-bold tracking-wider text-emerald-300">PASS</span>;
}
