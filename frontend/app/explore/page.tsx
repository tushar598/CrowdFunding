"use client";

import Link from "next/link";
import { useReadContract } from "wagmi";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/config/contract";
import { CampaignCard } from "@/components/CampaignCard";

export default function ExplorePage() {
  const { data: totalCampaigns, isLoading } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "totalCampaigns",
  });

  const count = totalCampaigns ? Number(totalCampaigns) : 0;

  return (
    <div className="container">
      {/* Page Header */}
      <div style={{ marginBottom: "2rem" }}>
        <div className="section-tag">
          <span className="section-tag-dot" />
          <span>Discover Projects</span>
        </div>
        <h1
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: "2.25rem",
            fontWeight: 900,
            marginBottom: "0.5rem",
            letterSpacing: "-0.02em",
          }}
        >
          Explore Campaigns
        </h1>
        <p style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
          Browse all live and completed campaigns on the platform. Support projects you believe in.
        </p>
      </div>

      <div className="section-header" style={{ marginBottom: "1rem" }}>
        <div>
          <h2>
            All Campaigns ({count})
          </h2>
        </div>
        <Link href="/create" className="btn btn-primary btn-sm">
          + Create
        </Link>
      </div>

      {isLoading ? (
        <div className="empty-state">
          <span className="spinner" style={{ width: 40, height: 40 }} />
          <p style={{ marginTop: "1rem" }}>Loading campaigns…</p>
        </div>
      ) : count === 0 ? (
        <div
          className="glass-card animate-in"
          style={{ textAlign: "center", padding: "4rem 2rem" }}
        >
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📭</div>
          <h3
            style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 900,
              fontSize: "1.4rem",
              marginBottom: "0.5rem",
            }}
          >
            No campaigns yet
          </h3>
          <p
            style={{
              color: "var(--text-secondary)",
              marginBottom: "1.5rem",
            }}
          >
            Be the first to create a crowdfunding campaign on-chain!
          </p>
          <Link href="/create" className="btn btn-primary">
            🚀 Create the first campaign
          </Link>
        </div>
      ) : (
        <div className="campaign-grid">
          {Array.from({ length: count }, (_, i) => (
            <CampaignCard key={i} id={i} />
          ))}
        </div>
      )}
    </div>
  );
}
