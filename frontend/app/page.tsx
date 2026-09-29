"use client";

import Link from "next/link";
import { useReadContract } from "wagmi";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/config/contract";

/** Starburst SVG */
function StarburstIcon({ size = 20, color = "var(--lime)" }: { size?: number; color?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill={color}
      stroke="var(--border-color)"
      strokeWidth="2"
      strokeLinejoin="round"
      width={size}
      height={size}
    >
      <polygon points="50,0 62,35 98,35 69,57 80,92 50,71 20,92 31,57 2,35 38,35" />
    </svg>
  );
}

export default function HomePage() {
  const { data: totalCampaigns } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "totalCampaigns",
  });

  const count = totalCampaigns ? Number(totalCampaigns) : 0;

  return (
    <>
      {/* Hero */}
      <section className="hero">
        <div className="hero-tag">
          <span className="hero-tag-dot" />
          Decentralised Crowdfunding on Ethereum
        </div>

        <h1>
          Fund the{" "}
          <span className="hero-highlight">Future</span>
        </h1>

        <p>
          Create trustless crowdfunding campaigns on Ethereum.
          No middlemen, no fees, no censorship — just smart contracts
          and community-backed trust.
        </p>

        <div className="hero-actions">
          <Link href="/create" className="btn btn-primary">
            <span>🚀</span>
            <span>Create Campaign</span>
          </Link>
          <a
            href="https://sepolia.etherscan.io/address/0xB2406bC8b45f0a3FCd16C679B8422a5D614593E3"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
          >
            <span>📄</span>
            <span>View on Etherscan</span>
          </a>
        </div>

        <div className="hero-trust">
          <div className="hero-trust-item">
            <span className="hero-trust-icon">✓</span>
            <span>100% On-Chain & Auditable</span>
          </div>
          <span style={{ color: "var(--border-light)" }}>·</span>
          <div className="hero-trust-item">
            <span className="hero-trust-icon">✓</span>
            <span>Automatic Refunds if Goal Not Met</span>
          </div>
          <span style={{ color: "var(--border-light)" }}>·</span>
          <div className="hero-trust-item">
            <span className="hero-trust-icon">✓</span>
            <span>Sepolia Testnet</span>
          </div>
        </div>
      </section>

      {/* Stats Banner Marquee */}
      <div className="stats-banner">
        <div className="stats-banner-track">
          {[...Array(2)].map((_, setIdx) => (
            <div
              key={setIdx}
              style={{ display: "flex", alignItems: "center", gap: "2.5rem" }}
            >
              <div className="stats-banner-item">
                <span className="stats-banner-value">{count}</span>
                <span className="stats-banner-label">Campaigns</span>
              </div>
              <StarburstIcon size={16} />
              <div className="stats-banner-item">
                <span className="stats-banner-value">ETH</span>
                <span className="stats-banner-label">Native Currency</span>
              </div>
              <StarburstIcon size={16} />
              <div className="stats-banner-item">
                <span className="stats-banner-value">0%</span>
                <span className="stats-banner-label">Platform Fees</span>
              </div>
              <StarburstIcon size={16} />
              <div className="stats-banner-item">
                <span className="stats-banner-value">100%</span>
                <span className="stats-banner-label">Trustless</span>
              </div>
              <StarburstIcon size={16} />
              <div className="stats-banner-item">
                <span className="stats-banner-value">Sepolia</span>
                <span className="stats-banner-label">Testnet</span>
              </div>
              <StarburstIcon size={16} />
            </div>
          ))}
        </div>
      </div>

      {/* Call to Action Section */}
      <div className="container" style={{ textAlign: "center", padding: "6rem 2rem" }}>
        <h2
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: "2.5rem",
            fontWeight: 900,
            marginBottom: "1rem",
            letterSpacing: "-0.02em",
          }}
        >
          Ready to make an impact?
        </h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem", marginBottom: "2rem", maxWidth: "600px", margin: "0 auto 2rem" }}>
          Whether you want to launch your own project or support others, MiniCrowdfund is the decentralized platform for you.
        </p>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/explore" className="btn btn-primary">
            Explore Campaigns
          </Link>
          <Link href="/dashboard" className="btn btn-secondary">
            Go to Dashboard
          </Link>
        </div>
      </div>
    </>
  );
}
