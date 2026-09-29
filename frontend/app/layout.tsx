import type { Metadata } from "next";
import "./globals.css";
import { Web3Provider } from "@/providers/Web3Provider";
import { Navbar } from "@/components/Navbar";
import { ToastProvider } from "@/components/Toast";

export const metadata: Metadata = {
  title: "MiniCrowdfund — Decentralised Crowdfunding on Ethereum",
  description:
    "Create and contribute to trustless crowdfunding campaigns on the Ethereum blockchain. Built with Solidity, Foundry, Next.js, and Wagmi.",
  openGraph: {
    title: "MiniCrowdfund — Decentralised Crowdfunding on Ethereum",
    description:
      "Create and contribute to trustless crowdfunding campaigns on the Ethereum blockchain.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MiniCrowdfund — Decentralised Crowdfunding on Ethereum",
    description:
      "Trustless crowdfunding on Ethereum — no middlemen, no fees.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* suppressHydrationWarning on body silences browser-extension attribute
          injections (e.g. cz-shortcut-listen from ColorZilla) that are added
          to <body> after React hydrates — these are not our code's fault. */}
      <body suppressHydrationWarning>
        <Web3Provider>
          <ToastProvider>
            <Navbar />
            <main>{children}</main>
          </ToastProvider>
        </Web3Provider>
      </body>
    </html>
  );
}
