// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title  MiniCrowdfund
 * @author Your Name
 * @notice A beginner-friendly, production-quality decentralised crowdfunding
 *         contract.  Campaign creators set a funding goal and a deadline.
 *         Contributors send ETH.  If the goal is met by the deadline the
 *         creator can withdraw.  If it is NOT met every contributor can claim
 *         a full refund.
 *
 * @dev    Design decisions:
 *         - Pull-over-push for refunds to avoid reentrancy from external calls.
 *         - Checks-Effects-Interactions (CEI) pattern throughout.
 *         - Custom errors instead of revert strings (saves gas).
 *         - Every important state change emits an event so off-chain indexers
 *           (The Graph, etc.) can track history without scanning storage.
 *         - NatSpec on all public surfaces so tooling can generate docs.
 */
contract MiniCrowdfund {
    // =========================================================================
    //  TYPES
    // =========================================================================

    /**
     * @notice All data for a single crowdfunding campaign.
     * @dev    We deliberately store the mapping INSIDE the struct so each
     *         campaign has its own isolated contribution ledger.
     *         Solidity does NOT allow structs with mappings to be returned from
     *         external functions directly – we expose a `getCampaign` view that
     *         returns the scalar fields only.
     */
    struct Campaign {
        address creator;      // who created the campaign
        string  title;        // short human-readable title
        string  description;  // longer description of what the money is for
        uint256 goal;         // target amount in wei
        uint256 deadline;     // unix timestamp after which no more contributions
        uint256 amountRaised; // total ETH received so far (in wei)
        bool    withdrawn;    // true once the creator has withdrawn the funds
        // Per-address contribution ledger.
        // The mapping key is the contributor's address.
        mapping(address => uint256) contributions;
    }

    // =========================================================================
    //  STATE
    // =========================================================================

    /// @notice Auto-incrementing counter used as the next campaign's ID.
    uint256 public nextCampaignId;

    /// @notice campaignId → Campaign storage slot.
    mapping(uint256 => Campaign) private campaigns;

    // =========================================================================
    //  EVENTS
    // =========================================================================

    /**
     * @notice Emitted when a new campaign is created.
     * @param campaignId  The unique ID assigned to this campaign.
     * @param creator     Address of the campaign creator.
     * @param title       Campaign title.
     * @param goal        Funding goal in wei.
     * @param deadline    Unix timestamp of the campaign deadline.
     */
    event CampaignCreated(
        uint256 indexed campaignId,
        address indexed creator,
        string          title,
        uint256         goal,
        uint256         deadline
    );

    /**
     * @notice Emitted when someone contributes ETH to a campaign.
     * @param campaignId   The campaign that received the contribution.
     * @param contributor  Address that sent the ETH.
     * @param amount       Amount sent in wei.
     */
    event ContributionReceived(
        uint256 indexed campaignId,
        address indexed contributor,
        uint256         amount
    );

    /**
     * @notice Emitted when a creator successfully withdraws raised funds.
     * @param campaignId  Campaign whose funds were withdrawn.
     * @param creator     Address that received the ETH.
     * @param amount      Total amount withdrawn in wei.
     */
    event FundsWithdrawn(
        uint256 indexed campaignId,
        address indexed creator,
        uint256         amount
    );

    /**
     * @notice Emitted when a contributor claims a refund on a failed campaign.
     * @param campaignId   The failed campaign.
     * @param contributor  Address that received the refund.
     * @param amount       Amount refunded in wei.
     */
    event RefundIssued(
        uint256 indexed campaignId,
        address indexed contributor,
        uint256         amount
    );

    // =========================================================================
    //  CUSTOM ERRORS
    // =========================================================================
    // Custom errors are ~50 % cheaper than `require("string")` because they
    // don't store the string in the bytecode ABI.

    /// @notice Goal must be greater than zero.
    error GoalMustBeGreaterThanZero();

    /// @notice Duration must be at least 60 seconds.
    error DurationTooShort(uint256 provided, uint256 minimum);

    /// @notice Campaign does not exist.
    error CampaignNotFound(uint256 campaignId);

    /// @notice Contributions are not accepted after the deadline.
    error CampaignDeadlinePassed(uint256 campaignId, uint256 deadline);

    /// @notice Contribution amount must be greater than zero.
    error ContributionMustBeGreaterThanZero();

    /// @notice Only the campaign creator may call this.
    error OnlyCreatorCanCall(address caller, address creator);

    /// @notice Funds cannot be withdrawn until the deadline has passed.
    error DeadlineNotYetPassed(uint256 deadline, uint256 currentTime);

    /// @notice Campaign did not reach its goal – withdrawal not allowed.
    error GoalNotReached(uint256 goal, uint256 amountRaised);

    /// @notice Funds have already been withdrawn.
    error AlreadyWithdrawn(uint256 campaignId);

    /// @notice Refunds are only allowed after the deadline.
    error RefundNotAvailableYet(uint256 deadline, uint256 currentTime);

    /// @notice Refunds are only available when the goal was NOT reached.
    error CampaignSucceeded(uint256 campaignId);

    /// @notice The caller made no contribution to this campaign.
    error NoContributionToRefund(address caller, uint256 campaignId);

    /// @notice ETH transfer failed (low-level call returned false).
    error TransferFailed(address to, uint256 amount);

    // =========================================================================
    //  MINIMUM DURATION CONSTANT
    // =========================================================================

    /// @notice Minimum campaign duration to prevent spam / instant-close attacks.
    uint256 public constant MIN_DURATION = 60; // 60 seconds (adjust for production)

    // =========================================================================
    //  WRITE FUNCTIONS
    // =========================================================================

    /**
     * @notice Create a new crowdfunding campaign.
     * @param _title              Short title of the campaign.
     * @param _description        Longer description.
     * @param _goalInWei          Target amount that must be raised (in wei).
     * @param _durationInSeconds  How many seconds from now until the deadline.
     * @return campaignId         The ID assigned to the newly created campaign.
     */
    function createCampaign(
        string  calldata _title,
        string  calldata _description,
        uint256          _goalInWei,
        uint256          _durationInSeconds
    ) external returns (uint256 campaignId) {
        // --- CHECKS ---
        if (_goalInWei == 0) revert GoalMustBeGreaterThanZero();
        if (_durationInSeconds < MIN_DURATION)
            revert DurationTooShort(_durationInSeconds, MIN_DURATION);

        // --- EFFECTS ---
        campaignId = nextCampaignId; // save the ID we are about to use
        nextCampaignId++;            // increment BEFORE doing anything else

        Campaign storage c = campaigns[campaignId];
        c.creator     = msg.sender;
        c.title       = _title;
        c.description = _description;
        c.goal        = _goalInWei;
        c.deadline    = block.timestamp + _durationInSeconds;
        // amountRaised, withdrawn initialise to 0 / false automatically

        // --- INTERACTIONS (none – no external calls here) ---
        emit CampaignCreated(campaignId, msg.sender, _title, _goalInWei, c.deadline);
    }

    /**
     * @notice Contribute ETH to a campaign.
     * @dev    Payable – the ETH is automatically added to this contract's balance.
     *         Uses CEI: we update state (contributions + amountRaised) BEFORE
     *         emitting the event, which is considered an "interaction" with
     *         off-chain indexers.  No external ETH transfers happen here, so
     *         reentrancy is not a concern on this specific function.
     * @param _campaignId  ID of the campaign to fund.
     */
    function contribute(uint256 _campaignId) external payable {
        // --- CHECKS ---
        Campaign storage c = _requireCampaignExists(_campaignId);

        // Block.timestamp is not perfectly accurate but is good enough for
        // deadlines measured in minutes or hours.  Miners can only shift it by
        // ~15 seconds on Ethereum mainnet.
        if (block.timestamp >= c.deadline)
            revert CampaignDeadlinePassed(_campaignId, c.deadline);

        if (msg.value == 0) revert ContributionMustBeGreaterThanZero();

        // --- EFFECTS ---
        c.contributions[msg.sender] += msg.value;
        c.amountRaised              += msg.value;

        // --- INTERACTIONS (event emission – no external calls) ---
        emit ContributionReceived(_campaignId, msg.sender, msg.value);
    }

    /**
     * @notice Withdraw raised funds after a successful campaign.
     * @dev    Can only be called by the creator, after the deadline, and only
     *         when the goal has been met.  Uses pull-then-transfer pattern:
     *         state is cleared BEFORE the ETH transfer to prevent reentrancy.
     * @param _campaignId  ID of the campaign to withdraw from.
     */
    function withdraw(uint256 _campaignId) external {
        // --- CHECKS ---
        Campaign storage c = _requireCampaignExists(_campaignId);

        if (msg.sender != c.creator)
            revert OnlyCreatorCanCall(msg.sender, c.creator);

        if (block.timestamp < c.deadline)
            revert DeadlineNotYetPassed(c.deadline, block.timestamp);

        if (c.amountRaised < c.goal)
            revert GoalNotReached(c.goal, c.amountRaised);

        if (c.withdrawn)
            revert AlreadyWithdrawn(_campaignId);

        // --- EFFECTS (clear state BEFORE external call – CEI pattern) ---
        c.withdrawn = true;
        uint256 amount = c.amountRaised;
        // Note: we intentionally do NOT zero c.amountRaised so the record
        // stays accurate for historical queries.

        // --- INTERACTIONS ---
        emit FundsWithdrawn(_campaignId, msg.sender, amount);

        // Low-level call is the recommended way to transfer ETH in modern
        // Solidity (avoids the 2300-gas stipend limitation of `.transfer()`).
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        if (!success) revert TransferFailed(msg.sender, amount);
    }

    /**
     * @notice Claim a refund when a campaign fails to reach its goal.
     * @dev    Pull-over-push: each contributor calls this themselves.
     *         Contribution is zeroed BEFORE the ETH transfer (CEI pattern)
     *         so a malicious caller cannot re-enter and drain more ETH.
     * @param _campaignId  ID of the failed campaign.
     */
    function refund(uint256 _campaignId) external {
        // --- CHECKS ---
        Campaign storage c = _requireCampaignExists(_campaignId);

        if (block.timestamp < c.deadline)
            revert RefundNotAvailableYet(c.deadline, block.timestamp);

        if (c.amountRaised >= c.goal)
            revert CampaignSucceeded(_campaignId);

        uint256 contributed = c.contributions[msg.sender];
        if (contributed == 0)
            revert NoContributionToRefund(msg.sender, _campaignId);

        // --- EFFECTS (zero out BEFORE transfer) ---
        c.contributions[msg.sender] = 0;
        // Optionally reduce amountRaised to keep accounting accurate, but it
        // is not strictly necessary because the campaign already failed.
        c.amountRaised -= contributed;

        // --- INTERACTIONS ---
        emit RefundIssued(_campaignId, msg.sender, contributed);

        (bool success, ) = payable(msg.sender).call{value: contributed}("");
        if (!success) revert TransferFailed(msg.sender, contributed);
    }

    // =========================================================================
    //  VIEW / PURE FUNCTIONS
    // =========================================================================

    /**
     * @notice Returns all scalar fields of a campaign (excludes the internal
     *         contributions mapping which cannot be returned directly).
     * @param _campaignId  Campaign to look up.
     * @return creator      Address of the campaign creator.
     * @return title        Campaign title.
     * @return description  Campaign description.
     * @return goal         Goal amount in wei.
     * @return deadline     Unix timestamp deadline.
     * @return amountRaised Total ETH raised so far in wei.
     * @return withdrawn    Whether the creator has already withdrawn.
     */
    function getCampaign(uint256 _campaignId)
        external
        view
        returns (
            address creator,
            string  memory title,
            string  memory description,
            uint256 goal,
            uint256 deadline,
            uint256 amountRaised,
            bool    withdrawn
        )
    {
        Campaign storage c = _requireCampaignExists(_campaignId);
        return (
            c.creator,
            c.title,
            c.description,
            c.goal,
            c.deadline,
            c.amountRaised,
            c.withdrawn
        );
    }

    /**
     * @notice Returns how much a specific address contributed to a campaign.
     * @param _campaignId  Campaign ID.
     * @param _contributor Address of the contributor.
     * @return amount      Amount contributed in wei.
     */
    function getContribution(uint256 _campaignId, address _contributor)
        external
        view
        returns (uint256 amount)
    {
        Campaign storage c = _requireCampaignExists(_campaignId);
        return c.contributions[_contributor];
    }

    /**
     * @notice Returns true when a campaign has reached its goal.
     * @param _campaignId  Campaign to check.
     */
    function isSuccessful(uint256 _campaignId) external view returns (bool) {
        Campaign storage c = _requireCampaignExists(_campaignId);
        return c.amountRaised >= c.goal;
    }

    /**
     * @notice Returns true when the deadline has passed AND the goal was NOT met.
     * @param _campaignId  Campaign to check.
     */
    function isFailed(uint256 _campaignId) external view returns (bool) {
        Campaign storage c = _requireCampaignExists(_campaignId);
        return block.timestamp >= c.deadline && c.amountRaised < c.goal;
    }

    /**
     * @notice Seconds remaining until the campaign deadline.
     *         Returns 0 if the deadline has already passed.
     * @param _campaignId  Campaign to check.
     * @return seconds     Remaining time in seconds.
     */
    function timeLeft(uint256 _campaignId) external view returns (uint256) {
        Campaign storage c = _requireCampaignExists(_campaignId);
        if (block.timestamp >= c.deadline) return 0;
        return c.deadline - block.timestamp;
    }

    /**
     * @notice Returns the total number of campaigns ever created.
     *         Useful for iterating off-chain (index 0 … totalCampaigns-1).
     */
    function totalCampaigns() external view returns (uint256) {
        return nextCampaignId;
    }

    // =========================================================================
    //  INTERNAL HELPERS
    // =========================================================================

    /**
     * @dev Reverts with CampaignNotFound if no campaign exists at _campaignId.
     *      Returns a storage reference for cheap reuse by callers.
     */
    function _requireCampaignExists(uint256 _campaignId)
        internal
        view
        returns (Campaign storage)
    {
        // nextCampaignId is the NEXT id to be assigned, so valid IDs are
        // strictly less than it.
        if (_campaignId >= nextCampaignId)
            revert CampaignNotFound(_campaignId);
        return campaigns[_campaignId];
    }
}
