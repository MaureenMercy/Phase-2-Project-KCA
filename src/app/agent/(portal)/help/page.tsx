import { Panel } from "@/components/agent/SummaryCard";

export const metadata = { title: "Help and support" };

export default function HelpPage() {
  return (
    <>
      <h1 className="font-serif text-4xl">Help & support</h1>
      <Panel title="If something is blocked">
        <p>Pending applications can view status only. Approved agents can check in, observe and report at the assigned station. Suspended or revoked agents lose those functions immediately.</p>
      </Panel>
      <Panel title="If an invitation fails">
        <ul className="list-disc pl-5">
          <li>Invalid: ask the candidate for the correct reference.</li>
          <li>Expired: ask the candidate to issue a new nomination.</li>
          <li>Revoked: the candidate withdrew it.</li>
          <li>Already used: that nomination was completed.</li>
          <li>Unavailable: the candidate is at the Commission agent limit.</li>
        </ul>
      </Panel>
      <Panel title="DEMO MODE">
        <p>OTP, invitations and notifications are simulated. This prototype does not send SMS or connect to live KCA systems.</p>
      </Panel>
    </>
  );
}
