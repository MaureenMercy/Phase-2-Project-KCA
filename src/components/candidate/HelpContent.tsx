import { DEMO_CANDIDATE_ACCOUNTS } from "@/lib/seed";

export function HelpContent() {
  const featured = DEMO_CANDIDATE_ACCOUNTS.filter((item) => item.note);
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-4xl text-navy">Help &amp; support</h1>
        <p className="mt-2 max-w-2xl text-navy/70">
          This portal is for students who want to contest a SAKU election. It uses mock student
          records and simulated verification only.
        </p>
      </header>
      <section className="candidate-card space-y-3 p-6 text-sm leading-7 text-navy/80">
        <h2 className="font-serif text-2xl text-navy">How to apply</h2>
        <ol className="list-decimal space-y-2 pl-5">
          <li>Confirm your student registration number, National ID and mobile number.</li>
          <li>Enter the one-time code shown in this demonstration.</li>
          <li>Choose Election 1 (Delegates) or Election 2 (SAKU Council).</li>
          <li>Review the contest details. You cannot pick a different Electoral College.</li>
          <li>Upload the required photograph and documents, then send the form.</li>
        </ol>
        <p>
          Sending a form is not approval. Approval is not the same as being placed on a ballot.
        </p>
      </section>
      <section className="candidate-card space-y-3 p-6 text-sm leading-7 text-navy/80">
        <h2 className="font-serif text-2xl text-navy">If something is wrong</h2>
        <p>
          Use Request correction. Do not try to edit verified campus, school or department details
          yourself. Phone number changes also need a Commission review.
        </p>
        <p>
          National ID numbers are masked in ordinary views. Other identity documents are not
          accepted until the Electoral Commission configures that policy.
        </p>
      </section>
      <section className="candidate-card p-6">
        <h2 className="font-serif text-2xl text-navy">Demonstration students</h2>
        <ul className="mt-3 space-y-3 text-sm">
          {featured.map((item) => (
            <li key={item.studentId}>
              <p className="font-semibold text-navy">{item.fullName}</p>
              <p className="font-mono text-navy/70">
                {item.studentId} · National ID {item.nationalId} · {item.phone}
              </p>
              <p className="text-navy/55">{item.note}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
