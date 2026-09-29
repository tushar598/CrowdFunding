// Contract address deployed on Sepolia testnet
export const CONTRACT_ADDRESS = "0xB2406bC8b45f0a3FCd16C679B8422a5D614593E3" as const;

// ABI extracted from Foundry build output
export const CONTRACT_ABI = [
  {
    type: "function",
    name: "createCampaign",
    inputs: [
      { name: "_title", type: "string" },
      { name: "_description", type: "string" },
      { name: "_goalInWei", type: "uint256" },
      { name: "_durationInSeconds", type: "uint256" },
    ],
    outputs: [{ name: "campaignId", type: "uint256" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "contribute",
    inputs: [{ name: "_campaignId", type: "uint256" }],
    outputs: [],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "withdraw",
    inputs: [{ name: "_campaignId", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "refund",
    inputs: [{ name: "_campaignId", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getCampaign",
    inputs: [{ name: "_campaignId", type: "uint256" }],
    outputs: [
      { name: "creator", type: "address" },
      { name: "title", type: "string" },
      { name: "description", type: "string" },
      { name: "goal", type: "uint256" },
      { name: "deadline", type: "uint256" },
      { name: "amountRaised", type: "uint256" },
      { name: "withdrawn", type: "bool" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getContribution",
    inputs: [
      { name: "_campaignId", type: "uint256" },
      { name: "_contributor", type: "address" },
    ],
    outputs: [{ name: "amount", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "isSuccessful",
    inputs: [{ name: "_campaignId", type: "uint256" }],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "isFailed",
    inputs: [{ name: "_campaignId", type: "uint256" }],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "timeLeft",
    inputs: [{ name: "_campaignId", type: "uint256" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "totalCampaigns",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "nextCampaignId",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "MIN_DURATION",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "CampaignCreated",
    inputs: [
      { name: "campaignId", type: "uint256", indexed: true },
      { name: "creator", type: "address", indexed: true },
      { name: "title", type: "string", indexed: false },
      { name: "goal", type: "uint256", indexed: false },
      { name: "deadline", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "ContributionReceived",
    inputs: [
      { name: "campaignId", type: "uint256", indexed: true },
      { name: "contributor", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "FundsWithdrawn",
    inputs: [
      { name: "campaignId", type: "uint256", indexed: true },
      { name: "creator", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "RefundIssued",
    inputs: [
      { name: "campaignId", type: "uint256", indexed: true },
      { name: "contributor", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
] as const;
