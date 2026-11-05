import { BrandLogo } from "@/components/brand/BrandLogo";

export function BallotFrame({
  title,
  subtitle,
  children,
  preview = false,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  preview?: boolean;
}) {
  return (
    <main className="ballot-desk min-h-screen bg-[#f7f7f8] px-4 py-10 text-navy">
      <div className="mx-auto w-full max-w-xl">
        {preview ? (
          <p className="mb-6 rounded-2xl bg-[#D0B216]/25 px-4 py-3 text-center text-sm text-navy">
            Commission preview. This is the desk a voter or elector will see. Nothing on this screen is saved.{" "}
            <a className="font-semibold underline" href="/commission/desks">
              Back to the setup guide
            </a>
          </p>
        ) : null}
        <div className="mb-8 flex flex-col items-center text-center">
          <BrandLogo className="h-24 w-auto" surface="light" priority />
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
