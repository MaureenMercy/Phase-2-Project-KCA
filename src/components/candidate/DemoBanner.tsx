export function DemoBanner() {
  return (
    <div
      role="status"
      className="border-b border-amber-300/70 bg-amber-100 px-4 py-2 text-center text-sm text-navy"
    >
      <strong className="font-semibold tracking-wide">DEMO MODE / MOCK DATA ONLY.</strong>{" "}
      Identity checks, OTP codes and documents are simulated. This is not connected to live KCA
      systems and does not send real SMS messages.
    </div>
  );
}
