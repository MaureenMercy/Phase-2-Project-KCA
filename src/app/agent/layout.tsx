import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Election Agent Portal",
    template: "%s · Agent Portal",
  },
  description: "ORBIS Election Agent Portal for nominated SAKU Council election agents.",
};

export default function AgentRootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
