"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { publishNotice } from "@/lib/actions/media";

export function NoticeForm() {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <form
      className="space-y-3 rounded-2xl border border-navy/10 bg-white/90 p-6"
      onSubmit={async (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const result = await publishNotice({
          title: String(data.get("title") ?? ""),
          body: String(data.get("body") ?? ""),
          audience: String(data.get("audience") ?? "public") as "public" | "students" | "delegates",
        });
        setMessage(result.ok ? "Notice published." : result.error);
        if (result.ok) {
          event.currentTarget.reset();
          router.refresh();
        }
      }}
    >
      <input name="title" placeholder="Public notice title" className="w-full rounded-xl border border-navy/15 px-3 py-2" />
      <textarea name="body" rows={4} placeholder="Notice body" className="w-full rounded-xl border border-navy/15 px-3 py-2" />
      <select name="audience" className="rounded-xl border border-navy/15 px-3 py-2">
        <option value="public">Public</option>
        <option value="students">Students</option>
        <option value="delegates">Delegates</option>
      </select>
      <button className="block rounded-sm bg-gold px-4 py-2 text-xs font-bold tracking-[0.16em] text-navy uppercase" type="submit">
        Publish notice
      </button>
      {message ? <p className="text-sm text-navy/60">{message}</p> : null}
    </form>
  );
}
