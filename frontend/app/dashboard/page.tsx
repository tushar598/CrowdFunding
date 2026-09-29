"use client";

import { useAccount, useReadContract, useReadContracts } from "wagmi";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/config/contract";
import { CampaignCard } from "@/components/CampaignCard";
import Link from "next/link";
import { formatEther } from "viem";
import { useMounted } from "@/hooks/useMounted";

/** Starburst SVG */
function StarburstIcon({ size = 18, color = "var(--lime)" }: { size?: number; color?: string }) {
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

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const mounted = useMounted();

  const { data: totalCampaigns } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "totalCampaigns",
  });

  const count = totalCampaigns ? Number(totalCampaigns) : 0;

  // We construct calls to get all campaigns to filter them
  const calls = Array.from({ length: count }, (_, i) => ({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getCampaign" as const,
    args: [BigInt(i)],
  }));

  const { data: campaignsData, isLoading: isLoadingCampaigns } = useReadContracts({
    contracts: calls,
  });

  // Filter campaigns created by the user
  const myCampaignIds: number[] = [];
  let totalRaisedByMe = 0;
  let totalGoalByMe = 0;

  if (campaignsData && address) {
    campaignsData.forEach((result, idx) => {
      if (result.status === "success" && result.result) {
        const [creator, , , goal, , amountRaised] = result.result as unknown as readonly [
          string,
          string,
          string,
          bigint,
          bigint,
          bigint,
          boolean
        ];
        if (creator.toLowerCase() === address.toLowerCase()) {
          myCampaignIds.push(idx);
          totalRaisedByMe += parseFloat(formatEther(amountRaised));
          totalGoalByMe += parseFloat(formatEther(goal));
        }
      }
    });
  }

  return (
    <div className="container">
      {/* Page Header */}
      <div style={{ marginBottom: "2rem" }}>
        <div className="section-tag">
          <StarburstIcon size={14} color="var(--pink)" />
          <span>Analytics & Management</span>
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
          Dashboard
        </h1>
        <p style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
          Manage your campaigns, track funding progress, and monitor your overall impact.
        </p>
      </div>

      {!mounted ? (
        <div className="empty-state">
          <span className="spinner" style={{ width: 40, height: 40 }} />
        </div>
      ) : !isConnected ? (
        <div className="glass-card animate-in" style={{ textAlign: "center", padding: "4rem 2rem" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔒</div>
          <h3
            style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 900,
              fontSize: "1.4rem",
              marginBottom: "0.5rem",
            }}
          >
            Wallet Not Connected
          </h3>
          <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
            Please connect your wallet to view your personalized dashboard.
          </p>
        </div>
      ) : (
        <div className="animate-in">
          <div className="detail-stats" style={{ marginBottom: "2rem" }}>
            <div className="stat-item">
              <div className="stat-label">My Campaigns</div>
              <div className="stat-value">{myCampaignIds.length}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Total Goal (ETH)</div>
              <div className="stat-value">{totalGoalByMe.toFixed(4)}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Total Raised (ETH)</div>
              <div className="stat-value" style={{ color: "var(--emerald)" }}>
                {totalRaisedByMe.toFixed(4)}
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Success Rate</div>
              <div className="stat-value" style={{ color: "var(--lime)" }}>
                {totalGoalByMe > 0 ? ((totalRaisedByMe / totalGoalByMe) * 100).toFixed(1) : "0.0"}%
              </div>
            </div>
          </div>

          {/* User's Campaigns Section */}
          <div className="section-header" style={{ marginBottom: "1rem" }}>
            <div>
              <div className="section-tag">
                <span className="section-tag-dot" />
                Management
              </div>
              <h2>My Created Campaigns</h2>
            </div>
            <Link href="/create" className="btn btn-primary btn-sm">
              + Create New
            </Link>
          </div>

          {isLoadingCampaigns ? (
            <div className="empty-state">
              <span className="spinner" style={{ width: 40, height: 40 }} />
              <p style={{ marginTop: "1rem" }}>Loading your campaigns…</p>
            </div>
          ) : myCampaignIds.length === 0 ? (
            <div className="glass-card" style={{ textAlign: "center", padding: "3rem 1.5rem" }}>
              <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem", fontWeight: 700 }}>
                You haven&apos;t created any campaigns yet.
              </p>
              <Link href="/create" className="btn btn-primary">
                Launch Your First Campaign
              </Link>
            </div>
          ) : (
            <div className="campaign-grid">
              {myCampaignIds.map((id) => (
                <CampaignCard key={id} id={id} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
