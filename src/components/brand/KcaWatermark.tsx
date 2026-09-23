export function KcaWatermark() {
  return (
    <div
      aria-hidden="true"
      className="kca-watermark pointer-events-none absolute inset-0 overflow-hidden print:hidden"
    >
      <img
        src="/kca-logo.png"
        alt=""
        className="pointer-events-none absolute top-1/2 left-1/2 h-[min(520px,70vh)] w-auto -translate-x-1/2 -translate-y-1/2 object-contain opacity-[0.07] select-none"
      />
    </div>
  );
}
