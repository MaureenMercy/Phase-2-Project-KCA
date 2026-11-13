import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Candidate Portal",
    template: "%s · ORBIS Candidate Portal",
  },
  description:
    "Apply to contest the KCA University SAKU Delegates Election or SAKU Council Election.",
};

export default function CandidateRootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
