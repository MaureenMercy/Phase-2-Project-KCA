"use client";

import { useMemo, useState } from "react";
import { saveAccessibilityDeclaration } from "@/lib/actions/voter-portal";
import type { AccessibilityCategory, AccessibilityProfile } from "@/lib/types";
import { ACCESSIBILITY_ACCOMMODATIONS, ACCESSIBILITY_CATEGORIES, ACCESSIBILITY_COPY } from "@/lib/voter";

const field =
  "w-full rounded-xl border border-navy/15 bg-white px-3 py-3 text-sm text-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold";

export function AccessibilityForm({
  initial,
  submitLabel = "Save preferences",
}: {
  initial: AccessibilityProfile;
  submitLabel?: string;
}) {
  const [categories, setCategories] = useState<AccessibilityCategory[]>(initial.categories);
  const [accommodations, setAccommodations] = useState<string[]>(initial.accommodations);
  const [notes, setNotes] = useState(initial.notes);
  const [consent, setConsent] = useState(initial.consentToShareOperationally);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const options = useMemo(
    () => categories.flatMap((category) => ACCESSIBILITY_ACCOMMODATIONS[category] ?? []),
    [categories],
  );

  function toggleCategory(id: AccessibilityCategory) {
    setCategories((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  function toggleAccommodation(id: string) {
    setAccommodations((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  async function save(withdraw = false) {
    setPending(true);
    setMessage(null);
    const result = await saveAccessibilityDeclaration({
      categories: withdraw ? [] : categories,
      accommodations: withdraw ? [] : accommodations,
      notes: withdraw ? "" : notes,
      consentToShareOperationally: withdraw ? false : consent,
      withdraw,
    });
    setPending(false);
    setMessage(result.ok ? (withdraw ? "Preferences withdrawn." : "Preferences saved. This does not change registration approval.") : result.error);
    if (result.ok && withdraw) {
      setCategories([]);
      setAccommodations([]);
      setNotes("");
      setConsent(false);
    }
  }

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        void save(false);
      }}
    >
      <p className="text-sm leading-6 text-navy/70">{ACCESSIBILITY_COPY}</p>
      <fieldset>
        <legend className="text-sm font-semibold text-navy">What kind of assistance would help?</legend>
        <p className="mt-1 text-xs text-navy/55">You may select more than one. We do not ask for a medical diagnosis.</p>
        <div className="mt-3 grid gap-2">
          {ACCESSIBILITY_CATEGORIES.map((item) => (
            <label key={item.id} className="flex min-h-11 items-center gap-3 rounded-xl bg-cream/80 px-3 py-2 text-sm">
              <input
                type="checkbox"
                checked={categories.includes(item.id)}
                onChange={() => toggleCategory(item.id)}
                className="h-4 w-4"
              />
              {item.label}
            </label>
          ))}
        </div>
      </fieldset>

      {options.length > 0 ? (
        <fieldset>
          <legend className="text-sm font-semibold text-navy">What practical accommodation would help?</legend>
          <div className="mt-3 grid gap-2">
            {options.map((item) => (
              <label key={item.id} className="flex min-h-11 items-center gap-3 rounded-xl bg-cream/80 px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  checked={accommodations.includes(item.id) || accommodations.includes(item.label)}
                  onChange={() => toggleAccommodation(item.id)}
                  className="h-4 w-4"
                />
                {item.label}
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}

      {categories.includes("other") ? (
        <label className="block text-sm font-semibold text-navy">
          Other assistance
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={3}
            className={`${field} mt-2`}
            placeholder="Describe the practical help you would like. Avoid unnecessary medical detail."
          />
        </label>
      ) : (
        <label className="block text-sm font-semibold text-navy">
          Anything else we should know for practical support?
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={3}
            className={`${field} mt-2`}
            placeholder="Optional. Keep this to practical voting support."
          />
        </label>
      )}

      <label className="flex items-start gap-3 rounded-xl border border-navy/10 bg-white px-3 py-3 text-sm leading-6 text-navy/80">
        <input
          type="checkbox"
          checked={consent}
          onChange={(event) => setConsent(event.target.checked)}
          className="mt-1 h-4 w-4"
        />
        I consent to sharing only the minimum practical accommodation information with authorized polling-station personnel. Accessibility details are not connected to ballot selections.
      </label>

      {message ? <p className="text-sm text-navy/70" role="status">{message}</p> : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={pending}
          className="min-h-11 rounded-sm bg-navy px-5 py-2.5 text-xs font-bold tracking-[0.16em] text-cream uppercase disabled:opacity-50"
        >
          {pending ? "Saving…" : submitLabel}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => void save(true)}
          className="min-h-11 rounded-sm border border-navy/20 px-5 py-2.5 text-xs font-bold tracking-[0.16em] text-navy uppercase"
        >
          Withdraw preferences
        </button>
      </div>
    </form>
  );
}
