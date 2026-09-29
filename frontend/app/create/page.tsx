"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from "wagmi";
import { parseEther } from "viem";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/config/contract";
import { useToast } from "@/components/Toast";
import Link from "next/link";

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

export default function CreateCampaignPage() {
  const router = useRouter();
  const { isConnected } = useAccount();
  const { addToast } = useToast();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [goalEth, setGoalEth] = useState("");
  const [durationDays, setDurationDays] = useState("");

  const { writeContract, data: txHash, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // ── Redirect on success — in useEffect to avoid render-loop ──
  useEffect(() => {
    if (isSuccess) {
      addToast("🎉 Campaign created successfully!", "success");
      router.push("/");
    }
  }, [isSuccess]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!isConnected) {
      addToast("Please connect your wallet first.", "error");
      return;
    }

    const goal = parseFloat(goalEth);
    const days = parseFloat(durationDays);

    if (!title.trim()) {
      addToast("Title is required.", "error");
      return;
    }
    if (goal <= 0 || isNaN(goal)) {
      addToast("Goal must be greater than 0 ETH.", "error");
      return;
    }
    if (days <= 0 || isNaN(days)) {
      addToast("Duration must be greater than 0 days.", "error");
      return;
    }

    const durationSeconds = BigInt(Math.floor(days * 86400));

    writeContract(
      {
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "createCampaign",
        args: [title, description, parseEther(goalEth), durationSeconds],
      },
      {
        onError: (err) => {
          addToast(`Transaction failed: ${err.message.slice(0, 100)}`, "error");
        },
      }
    );
  }

  const isSubmitting = isPending || isConfirming;

  return (
    <div className="container" style={{ maxWidth: 640 }}>
      <Link href="/" className="back-link">
        ← Back to all campaigns
      </Link>

      {/* Page Header */}
      <div style={{ marginBottom: "2rem" }}>
        <div className="section-tag">
          <StarburstIcon size={14} color="var(--emerald)" />
          <span>Launch Your Vision</span>
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
          Create a Campaign
        </h1>
        <p style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
          Set your funding goal, describe your project, and let the community back you.
          All campaigns are deployed directly to the Ethereum blockchain.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="glass-card animate-in">
        {/* Form header inside card */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            marginBottom: "1.5rem",
            paddingBottom: "1rem",
            borderBottom: "2px solid var(--border-light)",
          }}
        >
          <StarburstIcon size={16} />
          <span
            className="font-mono"
            style={{
              fontSize: "0.7rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--text-muted)",
            }}
          >
            Campaign Details
          </span>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="title">Campaign Title *</label>
          <input
            id="title"
            className="form-input"
            type="text"
            placeholder="Build a School in Rural India"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={100}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="description">Description</label>
          <textarea
            id="description"
            className="form-textarea"
            placeholder="Describe what the funds will be used for..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
          />
          <span className="form-hint">{description.length}/500 characters</span>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label" htmlFor="goal">Goal (ETH) *</label>
            <input
              id="goal"
              className="form-input"
              type="number"
              step="0.0001"
              min="0.0001"
              placeholder="1.0"
              value={goalEth}
              onChange={(e) => setGoalEth(e.target.value)}
              required
            />
            <span className="form-hint">Min: 0.0001 ETH</span>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="duration">Duration (Days) *</label>
            <input
              id="duration"
              className="form-input"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="7"
              value={durationDays}
              onChange={(e) => setDurationDays(e.target.value)}
              required
            />
            <span className="form-hint">Rec: 7–30 days</span>
          </div>
        </div>

        {!isConnected && (
          <div
            style={{
              background: "var(--warning-bg)",
              border: "2px solid var(--warning)",
              padding: "0.75rem 1rem",
              fontSize: "0.82rem",
              fontWeight: 700,
              color: "var(--warning)",
              marginBottom: "1rem",
            }}
          >
            ⚠️ Connect your wallet using the button in the top right to create a campaign.
          </div>
        )}

        <button
          type="submit"
          className="btn btn-primary"
          disabled={isSubmitting || !isConnected}
          style={{ width: "100%", justifyContent: "center", marginTop: "0.5rem" }}
        >
          {!isConnected
            ? "Connect Wallet First"
            : isPending
            ? <><span className="spinner" /> Confirm in Wallet…</>
            : isConfirming
            ? <><span className="spinner" /> Confirming on Sepolia…</>
            : "🚀 Create Campaign"}
        </button>
      </form>
    </div>
  );
}
