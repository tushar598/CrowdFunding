"use client";

import { useState, useEffect } from "react";
import { useMounted } from "@/hooks/useMounted";
import { useParams } from "next/navigation";
import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useAccount,
} from "wagmi";
import { formatEther, parseEther } from "viem";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/config/contract";
import { useToast } from "@/components/Toast";
import Link from "next/link";

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Starburst SVG */
function StarburstIcon({
  size = 18,
  color = "var(--lime)",
}: {
  size?: number;
  color?: string;
}) {
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

/**
 * Formats a Unix timestamp into a clean, professional date string.
 * e.g.  "Sep 30, 2026 · 12:09 AM"
 */
function formatDeadline(unixSeconds: number): string {
  const d = new Date(unixSeconds * 1000);
  const date = d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const time = d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  return `${date} · ${time}`;
}

/**
 * Computes a live countdown string from the current browser time vs the
 * on-chain deadline timestamp. Returns null when the deadline has passed.
 */
function computeTimeLeft(
  deadlineUnix: number
): { label: string; ended: boolean } {
  const now = Math.floor(Date.now() / 1000);
  const diff = deadlineUnix - now;

  if (diff <= 0) return { label: "Ended", ended: true };

  const d = Math.floor(diff / 86400);
  const h = Math.floor((diff % 86400) / 3600);
  const m = Math.floor((diff % 3600) / 60);
  const s = diff % 60;

  if (d > 1) return { label: `${d} days ${h}h left`, ended: false };
  if (d === 1) return { label: `1 day ${h}h ${m}m left`, ended: false };
  if (h > 0)
    return { label: `${h}h ${m}m ${String(s).padStart(2, "0")}s`, ended: false };
  if (m > 0) return { label: `${m}m ${String(s).padStart(2, "0")}s`, ended: false };
  return { label: `${s}s`, ended: false };
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function CampaignDetailPage() {
  const params = useParams();
  const campaignId = Number(params.id);
  const { address, isConnected } = useAccount();
  const { addToast } = useToast();

  const [contributeAmount, setContributeAmount] = useState("");
  const mounted = useMounted();

  // Live countdown state — ticks every second using the on-chain deadline
  const [countdownLabel, setCountdownLabel] = useState<string>("—");
  const [deadlineEnded, setDeadlineEnded] = useState(false);

  // ── Contract reads ──
  const {
    data: campaignData,
    isLoading,
    refetch,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getCampaign",
    args: [BigInt(campaignId)],
  });

  const { data: myContribution } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getContribution",
    args: [BigInt(campaignId), address || "0x0000000000000000000000000000000000000000"],
    query: { enabled: !!address },
  });

  // ── Write hooks ──
  const {
    writeContract: contribute,
    data: contributeTx,
    isPending: isContributing,
  } = useWriteContract();
  const {
    writeContract: withdraw,
    data: withdrawTx,
    isPending: isWithdrawing,
  } = useWriteContract();
  const {
    writeContract: claimRefund,
    data: refundTx,
    isPending: isRefunding,
  } = useWriteContract();

  const { isLoading: isContributeConfirming, isSuccess: contributeSuccess } =
    useWaitForTransactionReceipt({ hash: contributeTx });
  const { isLoading: isWithdrawConfirming, isSuccess: withdrawSuccess } =
    useWaitForTransactionReceipt({ hash: withdrawTx });
  const { isLoading: isRefundConfirming, isSuccess: refundSuccess } =
    useWaitForTransactionReceipt({ hash: refundTx });

  // ── Live countdown ticker ──
  useEffect(() => {
    if (!campaignData) return;
    const deadlineUnix = Number(campaignData[4]); // index 4 = deadline

    const tick = () => {
      const result = computeTimeLeft(deadlineUnix);
      setCountdownLabel(result.label);
      setDeadlineEnded(result.ended);
    };

    // Defer initial tick to avoid synchronous setState in effect body
    const raf = requestAnimationFrame(tick);
    const interval = setInterval(tick, 1000);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(interval);
    };
  }, [campaignData]);

  // ── Tx success side-effects ──
  useEffect(() => {
    if (contributeSuccess) {
      // setState in callback — not synchronous in the effect body
      requestAnimationFrame(() => {
        addToast("🎉 Contribution sent!", "success");
        setContributeAmount("");
        refetch();
      });
    }
  }, [contributeSuccess]);

  useEffect(() => {
    if (withdrawSuccess) {
      requestAnimationFrame(() => {
        addToast("💰 Funds withdrawn successfully!", "success");
        refetch();
      });
    }
  }, [withdrawSuccess]);

  useEffect(() => {
    if (refundSuccess) {
      requestAnimationFrame(() => {
        addToast("✅ Refund claimed!", "success");
        refetch();
      });
    }
  }, [refundSuccess]);

  // ── Loading state ──
  if (isLoading || !campaignData) {
    return (
      <div className="container" style={{ textAlign: "center", padding: "4rem" }}>
        <span className="spinner" style={{ width: 40, height: 40 }} />
        <p style={{ marginTop: "1rem", color: "var(--text-secondary)" }}>
          Loading campaign #{campaignId}…
        </p>
      </div>
    );
  }

  // ── Parse data ──
  const [creator, title, description, goal, deadline, amountRaised, withdrawn] =
    campaignData;
  const goalEth = parseFloat(formatEther(goal));
  const raisedEth = parseFloat(formatEther(amountRaised));
  const progress =
    goalEth > 0 ? Math.min((raisedEth / goalEth) * 100, 100) : 0;
  const isGoalMet = raisedEth >= goalEth;
  const isCreator = mounted && address?.toLowerCase() === creator.toLowerCase();
  const myContribEth = mounted && myContribution
    ? parseFloat(formatEther(myContribution as bigint))
    : 0;

  // Determine campaign status
  let status: "active" | "success" | "failed" | "withdrawn";
  if (withdrawn) status = "withdrawn";
  else if (!deadlineEnded) status = "active";
  else if (isGoalMet) status = "success";
  else status = "failed";

  const statusConfig = {
    active: { label: "⏳ Active", cls: "badge-active" },
    success: { label: "✅ Goal Reached", cls: "badge-success" },
    failed: { label: "❌ Failed", cls: "badge-failed" },
    withdrawn: { label: "💰 Completed", cls: "badge-withdrawn" },
  };

  // Handlers
  function handleContribute(e: React.FormEvent) {
    e.preventDefault();
    if (!isConnected) {
      addToast("Connect your wallet first.", "error");
      return;
    }
    const amount = parseFloat(contributeAmount);
    if (amount <= 0 || isNaN(amount)) {
      addToast("Enter a valid amount.", "error");
      return;
    }
    contribute(
      {
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "contribute",
        args: [BigInt(campaignId)],
        value: parseEther(contributeAmount),
      },
      {
        onError: (err) =>
          addToast(`Error: ${err.message.slice(0, 100)}`, "error"),
      }
    );
  }

  function handleWithdraw() {
    withdraw(
      {
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "withdraw",
        args: [BigInt(campaignId)],
      },
      {
        onError: (err) =>
          addToast(`Error: ${err.message.slice(0, 100)}`, "error"),
      }
    );
  }

  function handleRefund() {
    claimRefund(
      {
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "refund",
        args: [BigInt(campaignId)],
      },
      {
        onError: (err) =>
          addToast(`Error: ${err.message.slice(0, 100)}`, "error"),
      }
    );
  }

  return (
    <div className="container">
      <Link href="/" className="back-link">
        ← Back to all campaigns
      </Link>

      <div className="detail-grid">
        {/* Left column — main content */}
        <div className="animate-in">
          {/* Detail Header */}
          <div className="detail-header" style={{ marginBottom: "2rem" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            marginBottom: "0.5rem",
          }}
        >
          <StarburstIcon size={14} color="var(--emerald)" />
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
            Campaign #{String(campaignId).padStart(3, "0")}
          </span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            marginBottom: "0.75rem",
            flexWrap: "wrap",
          }}
        >
          <h1 style={{ margin: 0 }}>{title}</h1>
          <span className={`badge ${statusConfig[status].cls}`}>
            {statusConfig[status].label}
          </span>
        </div>
        <p>{description || "No description provided."}</p>
          </div>

          <div className="detail-stats animate-in animate-delay-1" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
            <div className="stat-item">
              <div className="stat-label">Raised</div>
              <div
                className="stat-value"
                style={{ color: "var(--emerald)" }}
              >
                {raisedEth.toFixed(4)} ETH
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Goal</div>
              <div className="stat-value">{goalEth.toFixed(4)} ETH</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Time Left</div>
              <div
                className="stat-value"
                style={{
                  fontSize: "1rem",
                  fontVariantNumeric: "tabular-nums",
                  color: deadlineEnded
                    ? "var(--text-muted)"
                    : "var(--text-primary)",
                }}
              >
                {countdownLabel}
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Deadline</div>
              <div
                className="stat-value"
                style={{ fontSize: "0.8rem", lineHeight: 1.4 }}
              >
                {formatDeadline(Number(deadline))}
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div
            className="glass-card"
            style={{ marginBottom: "1.5rem" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "0.75rem",
              }}
            >
              <span
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 800,
                  fontSize: "1rem",
                }}
              >
                Funding Progress
              </span>
              <span
                className="font-mono"
                style={{
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  background: progress >= 100 ? "var(--emerald)" : "var(--lime)",
                  color: "#000",
                  padding: "0.15rem 0.5rem",
                  border: "2px solid var(--border-color)",
                }}
              >
                {progress.toFixed(1)}%
              </span>
            </div>
            <div
              className="progress-bar-container"
              style={{ height: 14 }}
            >
              <div
                className={`progress-bar-fill ${progress >= 100 ? "funded" : ""}`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="progress-stats">
              <span className="raised">{raisedEth.toFixed(4)} ETH raised</span>
              <span className="goal">of {goalEth.toFixed(4)} ETH goal</span>
            </div>
          </div>

          {/* Creator card */}
          <div className="glass-card">
            <div
              className="font-mono"
              style={{
                fontSize: "0.7rem",
                fontWeight: 700,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: "0.5rem",
              }}
            >
              Created by
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                flexWrap: "wrap",
              }}
            >
              <a
                href={`https://sepolia.etherscan.io/address/${creator}`}
                target="_blank"
                rel="noopener noreferrer"
                className="address-mono"
                style={{
                  borderBottom: "2px solid var(--border-light)",
                  paddingBottom: "2px",
                }}
              >
                {creator.slice(0, 6)}...{creator.slice(-4)}
              </a>
              {isCreator && (
                <span className="badge badge-active">You</span>
              )}
            </div>
          </div>
        </div>

        {/* Right column — actions */}
        <div className="animate-in animate-delay-2">
          {!mounted ? (
            <div className="glass-card" style={{ padding: "2rem", textAlign: "center" }}>
              <span className="spinner" />
            </div>
          ) : (
            <>
              {/* Contribute form — only show when active */}
              {status === "active" && (
                <form
                  className="glass-card"
                  onSubmit={handleContribute}
                  style={{ marginBottom: "1rem" }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      marginBottom: "0.75rem",
                    }}
                  >
                    <StarburstIcon size={16} color="var(--lime)" />
                    <h3
                      style={{
                        fontFamily: "'Syne', sans-serif",
                        fontWeight: 800,
                        fontSize: "1.1rem",
                      }}
                    >
                      Contribute ETH
                    </h3>
                  </div>

                  {isGoalMet && (
                    <div
                      style={{
                        background: "var(--success-bg)",
                        border: "2px solid var(--success)",
                        padding: "0.5rem 0.75rem",
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        color: "var(--success)",
                        marginBottom: "0.75rem",
                      }}
                    >
                      ✅ Goal already met — further contributions are welcome!
                    </div>
                  )}

                  <div className="form-group" style={{ marginTop: "0.5rem" }}>
                    <label className="form-label" htmlFor="contribute-amount">
                      Amount (ETH)
                    </label>
                    <input
                      id="contribute-amount"
                      className="form-input"
                      type="number"
                      step="0.0001"
                      min="0.0001"
                      placeholder="0.1"
                      value={contributeAmount}
                      onChange={(e) => setContributeAmount(e.target.value)}
                      required
                    />
                  </div>

                  {!isConnected ? (
                    <p
                      style={{
                        fontSize: "0.82rem",
                        color: "var(--text-muted)",
                        marginTop: "0.5rem",
                      }}
                    >
                      Connect your wallet to contribute.
                    </p>
                  ) : (
                    <button
                      type="submit"
                      className="btn btn-primary"
                      style={{ width: "100%", justifyContent: "center" }}
                      disabled={isContributing || isContributeConfirming}
                    >
                      {isContributing ? (
                        <><span className="spinner" /> Confirm in Wallet…</>
                      ) : isContributeConfirming ? (
                        <><span className="spinner" /> Confirming…</>
                      ) : (
                        "Contribute"
                      )}
                    </button>
                  )}
                </form>
              )}

              {/* My Contribution summary */}
              {myContribEth > 0 && (
                <div className="glass-card" style={{ marginBottom: "1rem" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>My Contribution</span>
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontWeight: 800,
                        color: "var(--emerald)",
                      }}
                    >
                      {myContribEth.toFixed(4)} ETH
                    </span>
                  </div>
                </div>
              )}

              {/* Withdraw — creator only after success */}
              {isCreator && status === "success" && (
                <div className="glass-card" style={{ marginBottom: "1rem" }}>
                  <h3
                    style={{
                      fontFamily: "'Syne', sans-serif",
                      fontWeight: 800,
                      fontSize: "1rem",
                      marginBottom: "0.75rem",
                    }}
                  >
                    💰 Withdraw Funds
                  </h3>
                  <p
                    style={{
                      fontSize: "0.82rem",
                      color: "var(--text-secondary)",
                      marginBottom: "1rem",
                    }}
                  >
                    Your campaign reached its goal! You can now withdraw the raised funds.
                  </p>
                  <button
                    className="btn btn-primary"
                    style={{ width: "100%", justifyContent: "center" }}
                    onClick={() =>
                      withdraw({
                        address: CONTRACT_ADDRESS,
                        abi: CONTRACT_ABI,
                        functionName: "withdraw",
                        args: [BigInt(campaignId)],
                      })
                    }
                    disabled={isWithdrawing || isWithdrawConfirming}
                  >
                    {isWithdrawing ? (
                      <><span className="spinner" /> Confirm in Wallet…</>
                    ) : isWithdrawConfirming ? (
                      <><span className="spinner" /> Confirming…</>
                    ) : (
                      "Withdraw Funds"
                    )}
                  </button>
                </div>
              )}

              {/* Refund — contributors on failed campaigns */}
              {!isCreator && status === "failed" && myContribEth > 0 && (
                <div className="glass-card" style={{ marginBottom: "1rem" }}>
                  <h3
                    style={{
                      fontFamily: "'Syne', sans-serif",
                      fontWeight: 800,
                      fontSize: "1rem",
                      marginBottom: "0.75rem",
                    }}
                  >
                    ↩ Claim Refund
                  </h3>
                  <p
                    style={{
                      fontSize: "0.82rem",
                      color: "var(--text-secondary)",
                      marginBottom: "1rem",
                    }}
                  >
                    This campaign failed to meet its goal. Reclaim your {myContribEth.toFixed(4)} ETH.
                  </p>
                  <button
                    className="btn btn-danger"
                    style={{ width: "100%", justifyContent: "center" }}
                    onClick={() =>
                      claimRefund({
                        address: CONTRACT_ADDRESS,
                        abi: CONTRACT_ABI,
                        functionName: "refund",
                        args: [BigInt(campaignId)],
                      })
                    }
                    disabled={isRefunding || isRefundConfirming}
                  >
                    {isRefunding ? (
                      <><span className="spinner" /> Confirm in Wallet…</>
                    ) : isRefundConfirming ? (
                      <><span className="spinner" /> Confirming…</>
                    ) : (
                      "Claim Refund"
                    )}
                  </button>
                </div>
              )}

              {/* Terminal info states */}
              {status === "withdrawn" && (
                <div className="glass-card">
                  <p
                    style={{
                      color: "var(--text-secondary)",
                      textAlign: "center",
                      margin: 0,
                      fontWeight: 700,
                    }}
                  >
                    ✅ Funds have been withdrawn by the creator.
                  </p>
                </div>
              )}

              {status === "failed" && myContribEth === 0 && !isCreator && (
                <div className="glass-card">
                  <p
                    style={{
                      color: "var(--text-secondary)",
                      textAlign: "center",
                      margin: 0,
                      fontWeight: 700,
                    }}
                  >
                    ❌ This campaign ended without reaching its goal.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

