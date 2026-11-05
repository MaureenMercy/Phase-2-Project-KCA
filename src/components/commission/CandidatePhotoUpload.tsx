"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { uploadCandidatePhoto } from "@/lib/actions/ops";

export function CandidatePhotoUpload({
  candidateId,
  kind,
  disabled,
}: {
  candidateId: string;
  kind: "delegate" | "leadership" | "cabinet";
  disabled?: boolean;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMessage("Use a JPEG or PNG image.");
      return;
    }
    setPending(true);
    setMessage(null);
    const data = await readAsBase64(file);
    let result: Awaited<ReturnType<typeof uploadCandidatePhoto>>;
    try {
      result = await uploadCandidatePhoto({
        candidateId,
        kind,
        mimeType: file.type,
        data,
      });
    } catch {
      setPending(false);
      setMessage("The portrait did not reach the server. Refresh the page and try again.");
      return;
    }
    setPending(false);
    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <label className="block text-xs text-navy/60">
      <span className="sr-only">Upload candidate portrait</span>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        disabled={disabled || pending}
        onChange={(event) => void onChange(event)}
        className="block w-full text-[11px] file:mr-2 file:rounded-sm file:border-0 file:bg-navy file:px-2 file:py-1 file:text-[10px] file:font-bold file:tracking-wide file:text-cream file:uppercase"
      />
      {pending ? <span className="mt-1 block text-navy/45">Saving portrait…</span> : null}
      {message ? <span className="mt-1 block text-red-700">{message}</span> : null}
    </label>
  );
}

function readAsBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? "");
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
