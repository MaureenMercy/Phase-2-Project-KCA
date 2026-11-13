"use client";

import { useState } from "react";

export function FileUploadField({
  label,
  hint,
  accept,
  currentName,
  disabled,
  onFile,
}: {
  label: string;
  hint: string;
  accept: string;
  currentName?: string | null;
  disabled?: boolean;
  onFile: (file: { filename: string; mimeType: string; size: number; dataUrl: string }) => Promise<void>;
}) {
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <label className="block rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
      <span className="text-sm font-semibold text-navy">{label}</span>
      <span className="mt-1 block text-xs text-navy/60">{hint}</span>
      <input
        type="file"
        accept={accept}
        disabled={disabled}
        className="mt-3 block w-full text-sm"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (!file) return;
          setError(null);
          setProgress("Reading file…");
          try {
            const dataUrl = await readFile(file, setProgress);
            setProgress("Saving…");
            await onFile({
              filename: file.name,
              mimeType: file.type || "application/octet-stream",
              size: file.size,
              dataUrl,
            });
            setProgress("Uploaded");
          } catch (caught) {
            setProgress(null);
            setError(caught instanceof Error ? caught.message : "The file could not be uploaded.");
          }
        }}
      />
      {currentName ? (
        <p className="mt-2 text-sm text-emerald-800">Current file: {currentName}</p>
      ) : null}
      {progress ? <p className="mt-2 text-sm text-navy/70">{progress}</p> : null}
      {error ? (
        <p role="alert" className="mt-2 text-sm text-rose-800">
          {error}
        </p>
      ) : null}
    </label>
  );
}

function readFile(file: File, onProgress: (label: string) => void) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(`Reading file… ${Math.round((event.loaded / event.total) * 100)}%`);
      }
    };
    reader.onerror = () => reject(new Error("The file could not be read."));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}
