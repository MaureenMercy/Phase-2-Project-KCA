export function OpsStatusBanner({
  online,
  currentIp,
}: {
  online: boolean;
  currentIp?: string;
}) {
  return (
    <aside
      className={`rounded-2xl border px-5 py-4 text-sm ${
        online
          ? "border-emerald-200 bg-emerald-50 text-emerald-950"
          : "border-amber-200 bg-amber-50 text-amber-950"
      }`}
    >
      {online ? (
        <p>
          Operations API is running on a separate process (default{" "}
          <code>http://127.0.0.1:4000</code>) with MongoDB on port 27017.
          {currentIp ? ` This workstation appears as ${currentIp}.` : ""}
        </p>
      ) : (
        <p>
          Operations API is offline. The Commission pages still load, but votes,
          IPs, and portraits will not persist until you run{" "}
          <code>npm run api</code> or <code>npm run dev:stack</code>.
        </p>
      )}
    </aside>
  );
}
