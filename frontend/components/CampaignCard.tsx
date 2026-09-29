"use client";

import Link from "next/link";
import { useReadContract } from "wagmi";
import { formatEther } from "viem";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/config/contract";

interface CampaignCardProps {
  id: number;
}

/** Random accent color for card top strip */
const CARD_ACCENTS = ["var(--lime)", "var(--emerald)", "var(--pink)", "#DFFF38"];

export function CampaignCard({ id }: CampaignCardProps) {
  const { data, isLoading } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getCampaign",
    args: [BigInt(id)],
  });

  const { data: timeLeftData } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "timeLeft",
    args: [BigInt(id)],
  });

  if (isLoading || !data) {
    return (
      <div
        className="glass-card"
        style={{
          minHeight: "220px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span className="spinner" />
      </div>
    );
  }

  const [creator, title, description, goal, , amountRaised, withdrawn] = data;
  const goalEth = parseFloat(formatEther(goal));
  const raisedEth = parseFloat(formatEther(amountRaised));
  const progress = goalEth > 0 ? Math.min((raisedEth / goalEth) * 100, 100) : 0;
  const timeRemaining = timeLeftData ? Number(timeLeftData) : 0;
  const deadlinePassed = timeRemaining === 0;
  const isSuccess = raisedEth >= goalEth;

  // Determine status
  let status: "active" | "success" | "failed" | "withdrawn";
  if (withdrawn) status = "withdrawn";
  else if (!deadlinePassed) status = "active";
  else if (isSuccess) status = "success";
  else status = "failed";

  const statusLabels = {
    active: "⏳ Active",
    success: "✅ Funded",
    failed: "❌ Failed",
    withdrawn: "💰 Withdrawn",
  };

  function formatTimeLeft(seconds: number): string {
    if (seconds <= 0) return "Ended";
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (d > 0) return `${d}d ${h}h left`;
    if (h > 0) return `${h}h ${m}m left`;
    return `${m}m left`;
  }

  const accentColor = CARD_ACCENTS[id % CARD_ACCENTS.length];

  return (
    <Link href={`/campaign/${id}`} style={{ textDecoration: "none" }}>
      <div className="glass-card" style={{ padding: 0, overflow: "hidden" }}>
        {/* Colored top strip */}
        <div
          style={{
            height: "6px",
            background: accentColor,
            borderBottom: "2px solid var(--border-color)",
          }}
        />

        <div style={{ padding: "1.5rem" }}>
          {/* Meta row */}
          <div className="campaign-card-meta">
            <span className={`badge badge-${status}`}>
              {statusLabels[status]}
            </span>
            <span
              className="font-mono"
              style={{ fontSize: "0.75rem", fontWeight: 700 }}
            >
              {formatTimeLeft(timeRemaining)}
            </span>
          </div>

          {/* Title */}
          <h3 className="campaign-card-title">{title}</h3>
          <p className="campaign-card-desc">{description}</p>

          {/* Progress bar */}
          <div className="progress-bar-container">
            <div
              className={`progress-bar-fill ${progress >= 100 ? "funded" : ""}`}
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Stats */}
          <div className="progress-stats">
            <span className="raised">{raisedEth.toFixed(4)} ETH</span>
            <span className="goal">of {goalEth.toFixed(4)} ETH</span>
          </div>

          {/* Creator */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span
              className="font-mono"
              style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}
            >
              by {creator.slice(0, 6)}...{creator.slice(-4)}
            </span>
            <span
              className="font-mono"
              style={{
                fontSize: "0.65rem",
                fontWeight: 700,
                background: accentColor,
                color: "#000",
                padding: "0.15rem 0.5rem",
                border: "1.5px solid var(--border-color)",
              }}
            >
              #{String(id).padStart(3, "0")}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
