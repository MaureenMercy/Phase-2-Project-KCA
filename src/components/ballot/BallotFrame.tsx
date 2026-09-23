import { KcaCrest } from "@/components/brand/KcaCrest";

export function BallotFrame({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="ballot-desk min-h-screen bg-[#f7f7f8] px-4 py-10 text-navy">
      <div className="mx-auto w-full max-w-xl">
        <div className="mb-8 flex flex-col items-center text-center">
          <KcaCrest className="h-16 w-auto" />
          <p className="mt-4 text-[11px] tracking-[0.28em] text-navy/40 uppercase">
            KCA University · SAKU
          </p>
          <h1 className="mt-2 font-serif text-3xl text-navy">{title}</h1>
          {subtitle ? <p className="mt-2 text-sm text-navy/60">{subtitle}</p> : null}
        </div>
        {children}
      </div>
    </main>
  );
}
