// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console2} from "forge-std/Test.sol";
import {MiniCrowdfund} from "../src/MiniCrowdfund.sol";

/**
 * @title  MiniCrowdfundTest
 * @notice Comprehensive unit-test suite for MiniCrowdfund.
 *
 * Test layout
 * ───────────
 *  1. Helpers & state
 *  2. createCampaign tests
 *  3. contribute tests
 *  4. withdraw tests  (success path)
 *  5. refund tests    (failure path)
 *  6. View function tests
 *  7. Edge cases & integration scenarios
 *
 * Foundry cheat codes used
 * ─────────────────────────
 *  vm.prank(addr)            – next call comes from addr
 *  vm.deal(addr, amount)     – set ETH balance
 *  vm.warp(timestamp)        – move block.timestamp forward
 *  vm.expectRevert(err)      – assert the next call reverts with err
 *  vm.expectEmit(...)        – assert an event is emitted
 *  hoax(addr, value)         – prank + deal in one call
 */
contract MiniCrowdfundTest is Test {
    // =========================================================================
    //  EVENTS (re-declared so vm.expectEmit can reference them in-scope)
    // =========================================================================
    event CampaignCreated(uint256 indexed campaignId, address indexed creator, string title, uint256 goal, uint256 deadline);
    event ContributionReceived(uint256 indexed campaignId, address indexed contributor, uint256 amount);
    event FundsWithdrawn(uint256 indexed campaignId, address indexed creator, uint256 amount);
    event RefundIssued(uint256 indexed campaignId, address indexed contributor, uint256 amount);

    // =========================================================================
    //  STATE & CONSTANTS
    // =========================================================================

    MiniCrowdfund public crowdfund;

    // Named test actors (addresses derived from private keys 1-4 for clarity)
    address public CREATOR     = makeAddr("creator");
    address public ALICE       = makeAddr("alice");
    address public BOB         = makeAddr("bob");
    address public CAROL       = makeAddr("carol");

    // Common campaign parameters used across many tests
    string  constant TITLE       = "Build a School";
    string  constant DESCRIPTION = "Funding a primary school in rural India";
    uint256 constant GOAL        = 10 ether;
    uint256 constant DURATION    = 7 days;

    // =========================================================================
    //  SETUP
    // =========================================================================

    function setUp() public {
        // Deploy a fresh contract before every single test function
        crowdfund = new MiniCrowdfund();

        // Give our actors some ETH
        vm.deal(CREATOR, 1  ether);
        vm.deal(ALICE,   20 ether);
        vm.deal(BOB,     20 ether);
        vm.deal(CAROL,   20 ether);
    }

    // =========================================================================
    //  HELPERS
    // =========================================================================

    /// @dev Creates a standard campaign as CREATOR and returns its ID.
    function _createDefaultCampaign() internal returns (uint256 id) {
        vm.prank(CREATOR);
        id = crowdfund.createCampaign(TITLE, DESCRIPTION, GOAL, DURATION);
    }

    /// @dev Warp past the campaign deadline.
    function _passDeadline() internal {
        vm.warp(block.timestamp + DURATION + 1);
    }

    // =========================================================================
    //  1. createCampaign
    // =========================================================================

    function test_createCampaign_succeeds() public {
        vm.prank(CREATOR);

        // Assert the CampaignCreated event is emitted correctly.
        // vm.expectEmit args: (checkTopic1, checkTopic2, checkTopic3, checkData)
        vm.expectEmit(true, true, false, true);
        emit CampaignCreated(0, CREATOR, TITLE, GOAL, block.timestamp + DURATION);

        uint256 id = crowdfund.createCampaign(TITLE, DESCRIPTION, GOAL, DURATION);

        assertEq(id, 0, "First campaign ID should be 0");
        assertEq(crowdfund.nextCampaignId(), 1, "Counter should increment to 1");

        (
            address creator,
            string memory title,
            ,
            uint256 goal,
            uint256 deadline,
            uint256 amountRaised,
            bool withdrawn
        ) = crowdfund.getCampaign(0);

        assertEq(creator,     CREATOR,                    "Creator mismatch");
        assertEq(title,       TITLE,                      "Title mismatch");
        assertEq(goal,        GOAL,                       "Goal mismatch");
        assertEq(deadline,    block.timestamp + DURATION, "Deadline mismatch");
        assertEq(amountRaised, 0,                          "AmountRaised should start at 0");
        assertFalse(withdrawn,                             "withdrawn should start false");
    }

    function test_createCampaign_multipleIds() public {
        vm.startPrank(CREATOR);
        uint256 id0 = crowdfund.createCampaign("A", "a", 1 ether, 60);
        uint256 id1 = crowdfund.createCampaign("B", "b", 2 ether, 60);
        uint256 id2 = crowdfund.createCampaign("C", "c", 3 ether, 60);
        vm.stopPrank();

        assertEq(id0, 0);
        assertEq(id1, 1);
        assertEq(id2, 2);
        assertEq(crowdfund.totalCampaigns(), 3);
    }

    function test_createCampaign_revert_zeroGoal() public {
        vm.prank(CREATOR);
        vm.expectRevert(MiniCrowdfund.GoalMustBeGreaterThanZero.selector);
        crowdfund.createCampaign(TITLE, DESCRIPTION, 0, DURATION);
    }

    function test_createCampaign_revert_durationTooShort() public {
        vm.prank(CREATOR);
        vm.expectRevert(
            abi.encodeWithSelector(
                MiniCrowdfund.DurationTooShort.selector,
                59,                         // provided
                crowdfund.MIN_DURATION()    // minimum
            )
        );
        crowdfund.createCampaign(TITLE, DESCRIPTION, GOAL, 59);
    }

    function test_createCampaign_exactMinDuration_succeeds() public {
        vm.prank(CREATOR);
        // Should NOT revert at exactly MIN_DURATION
        crowdfund.createCampaign(TITLE, DESCRIPTION, GOAL, crowdfund.MIN_DURATION());
    }

    // =========================================================================
    //  2. contribute
    // =========================================================================

    function test_contribute_succeeds() public {
        uint256 id = _createDefaultCampaign();

        vm.expectEmit(true, true, false, true);
        emit ContributionReceived(id, ALICE, 1 ether);

        vm.prank(ALICE);
        crowdfund.contribute{value: 1 ether}(id);

        assertEq(crowdfund.getContribution(id, ALICE), 1 ether);
        (, , , , , uint256 raised, ) = crowdfund.getCampaign(id);
        assertEq(raised, 1 ether);
    }

    function test_contribute_multipleContributors() public {
        uint256 id = _createDefaultCampaign();

        vm.prank(ALICE); crowdfund.contribute{value: 4 ether}(id);
        vm.prank(BOB);   crowdfund.contribute{value: 3 ether}(id);
        vm.prank(CAROL); crowdfund.contribute{value: 3 ether}(id);

        assertEq(crowdfund.getContribution(id, ALICE), 4 ether);
        assertEq(crowdfund.getContribution(id, BOB),   3 ether);
        assertEq(crowdfund.getContribution(id, CAROL), 3 ether);

        (, , , , , uint256 raised, ) = crowdfund.getCampaign(id);
        assertEq(raised, 10 ether, "Total raised should be 10 ether");
    }

    function test_contribute_accumulatesFromSameSender() public {
        uint256 id = _createDefaultCampaign();

        vm.startPrank(ALICE);
        crowdfund.contribute{value: 2 ether}(id);
        crowdfund.contribute{value: 3 ether}(id);
        vm.stopPrank();

        assertEq(crowdfund.getContribution(id, ALICE), 5 ether);
    }

    function test_contribute_revert_afterDeadline() public {
        uint256 id = _createDefaultCampaign();
        (, , , , uint256 deadline, , ) = crowdfund.getCampaign(id);
        _passDeadline();

        vm.prank(ALICE);
        vm.expectRevert(
            abi.encodeWithSelector(
                MiniCrowdfund.CampaignDeadlinePassed.selector,
                id,
                deadline
            )
        );
        crowdfund.contribute{value: 1 ether}(id);
    }

    function test_contribute_revert_zeroValue() public {
        uint256 id = _createDefaultCampaign();

        vm.prank(ALICE);
        vm.expectRevert(MiniCrowdfund.ContributionMustBeGreaterThanZero.selector);
        crowdfund.contribute{value: 0}(id);
    }

    function test_contribute_revert_invalidCampaignId() public {
        vm.prank(ALICE);
        vm.expectRevert(
            abi.encodeWithSelector(MiniCrowdfund.CampaignNotFound.selector, 99)
        );
        crowdfund.contribute{value: 1 ether}(99);
    }

    // =========================================================================
    //  3. withdraw  (goal reached, deadline passed)
    // =========================================================================

    function test_withdraw_succeeds() public {
        uint256 id = _createDefaultCampaign();

        // Fund exactly the goal
        vm.prank(ALICE); crowdfund.contribute{value: 6 ether}(id);
        vm.prank(BOB);   crowdfund.contribute{value: 4 ether}(id);

        _passDeadline();

        uint256 creatorBalanceBefore = CREATOR.balance;

        vm.expectEmit(true, true, false, true);
        emit FundsWithdrawn(id, CREATOR, 10 ether);

        vm.prank(CREATOR);
        crowdfund.withdraw(id);

        // Creator should have received 10 ETH
        assertEq(CREATOR.balance, creatorBalanceBefore + 10 ether);

        // Contract balance should be 0
        assertEq(address(crowdfund).balance, 0);

        // Campaign should be marked withdrawn
        (, , , , , , bool withdrawn) = crowdfund.getCampaign(id);
        assertTrue(withdrawn);
    }

    function test_withdraw_revert_notCreator() public {
        uint256 id = _createDefaultCampaign();
        vm.prank(ALICE); crowdfund.contribute{value: 10 ether}(id);
        _passDeadline();

        vm.prank(ALICE);
        vm.expectRevert(
            abi.encodeWithSelector(
                MiniCrowdfund.OnlyCreatorCanCall.selector,
                ALICE,
                CREATOR
            )
        );
        crowdfund.withdraw(id);
    }

    function test_withdraw_revert_beforeDeadline() public {
        uint256 id = _createDefaultCampaign();
        vm.prank(ALICE); crowdfund.contribute{value: 10 ether}(id);
        // Do NOT warp – deadline hasn't passed
        (, , , , uint256 deadline, , ) = crowdfund.getCampaign(id);

        vm.prank(CREATOR);
        vm.expectRevert(
            abi.encodeWithSelector(
                MiniCrowdfund.DeadlineNotYetPassed.selector,
                deadline,            // deadline
                block.timestamp      // now
            )
        );
        crowdfund.withdraw(id);
    }

    function test_withdraw_revert_goalNotReached() public {
        uint256 id = _createDefaultCampaign();
        vm.prank(ALICE); crowdfund.contribute{value: 5 ether}(id); // only half
        _passDeadline();

        vm.prank(CREATOR);
        vm.expectRevert(
            abi.encodeWithSelector(
                MiniCrowdfund.GoalNotReached.selector,
                GOAL,
                5 ether
            )
        );
        crowdfund.withdraw(id);
    }

    function test_withdraw_revert_doubleWithdraw() public {
        uint256 id = _createDefaultCampaign();
        vm.prank(ALICE); crowdfund.contribute{value: 10 ether}(id);
        _passDeadline();

        vm.prank(CREATOR); crowdfund.withdraw(id); // first – OK

        vm.prank(CREATOR);
        vm.expectRevert(
            abi.encodeWithSelector(MiniCrowdfund.AlreadyWithdrawn.selector, id)
        );
        crowdfund.withdraw(id); // second – should revert
    }

    // =========================================================================
    //  4. refund  (goal NOT reached, deadline passed)
    // =========================================================================

    function test_refund_succeeds() public {
        uint256 id = _createDefaultCampaign();

        // Only 5 ETH raised – goal (10) not met
        vm.prank(ALICE); crowdfund.contribute{value: 3 ether}(id);
        vm.prank(BOB);   crowdfund.contribute{value: 2 ether}(id);
        _passDeadline();

        uint256 aliceBalanceBefore = ALICE.balance;

        vm.expectEmit(true, true, false, true);
        emit RefundIssued(id, ALICE, 3 ether);

        vm.prank(ALICE);
        crowdfund.refund(id);

        // Alice got her 3 ETH back
        assertEq(ALICE.balance, aliceBalanceBefore + 3 ether);

        // Her contribution is now zero (cannot double-refund)
        assertEq(crowdfund.getContribution(id, ALICE), 0);
    }

    function test_refund_multipleContributors() public {
        uint256 id = _createDefaultCampaign();

        vm.prank(ALICE); crowdfund.contribute{value: 2 ether}(id);
        vm.prank(BOB);   crowdfund.contribute{value: 3 ether}(id);
        _passDeadline();

        uint256 aliceBefore = ALICE.balance;
        uint256 bobBefore   = BOB.balance;

        vm.prank(ALICE); crowdfund.refund(id);
        vm.prank(BOB);   crowdfund.refund(id);

        assertEq(ALICE.balance, aliceBefore + 2 ether);
        assertEq(BOB.balance,   bobBefore   + 3 ether);
        assertEq(address(crowdfund).balance, 0);
    }

    function test_refund_revert_beforeDeadline() public {
        uint256 id = _createDefaultCampaign();
        vm.prank(ALICE); crowdfund.contribute{value: 1 ether}(id);
        (, , , , uint256 deadline, , ) = crowdfund.getCampaign(id);

        vm.prank(ALICE);
        vm.expectRevert(
            abi.encodeWithSelector(
                MiniCrowdfund.RefundNotAvailableYet.selector,
                deadline,
                block.timestamp
            )
        );
        crowdfund.refund(id);
    }

    function test_refund_revert_goalWasReached() public {
        uint256 id = _createDefaultCampaign();
        vm.prank(ALICE); crowdfund.contribute{value: 10 ether}(id);
        _passDeadline();

        vm.prank(ALICE);
        vm.expectRevert(
            abi.encodeWithSelector(MiniCrowdfund.CampaignSucceeded.selector, id)
        );
        crowdfund.refund(id);
    }

    function test_refund_revert_noContribution() public {
        uint256 id = _createDefaultCampaign();
        vm.prank(ALICE); crowdfund.contribute{value: 1 ether}(id);
        _passDeadline();

        // BOB never contributed
        vm.prank(BOB);
        vm.expectRevert(
            abi.encodeWithSelector(
                MiniCrowdfund.NoContributionToRefund.selector,
                BOB,
                id
            )
        );
        crowdfund.refund(id);
    }

    function test_refund_revert_doubleRefund() public {
        uint256 id = _createDefaultCampaign();
        vm.prank(ALICE); crowdfund.contribute{value: 1 ether}(id);
        _passDeadline();

        vm.prank(ALICE); crowdfund.refund(id); // first OK

        vm.prank(ALICE);
        vm.expectRevert(
            abi.encodeWithSelector(
                MiniCrowdfund.NoContributionToRefund.selector,
                ALICE,
                id
            )
        );
        crowdfund.refund(id); // second should revert
    }

    // =========================================================================
    //  5. View functions
    // =========================================================================

    function test_isSuccessful_true() public {
        uint256 id = _createDefaultCampaign();
        vm.prank(ALICE); crowdfund.contribute{value: 10 ether}(id);
        assertTrue(crowdfund.isSuccessful(id));
    }

    function test_isSuccessful_false() public {
        uint256 id = _createDefaultCampaign();
        vm.prank(ALICE); crowdfund.contribute{value: 5 ether}(id);
        assertFalse(crowdfund.isSuccessful(id));
    }

    function test_isFailed_true() public {
        uint256 id = _createDefaultCampaign();
        vm.prank(ALICE); crowdfund.contribute{value: 5 ether}(id);
        _passDeadline();
        assertTrue(crowdfund.isFailed(id));
    }

    function test_isFailed_false_goalReached() public {
        uint256 id = _createDefaultCampaign();
        vm.prank(ALICE); crowdfund.contribute{value: 10 ether}(id);
        _passDeadline();
        assertFalse(crowdfund.isFailed(id));
    }

    function test_isFailed_false_beforeDeadline() public {
        uint256 id = _createDefaultCampaign();
        vm.prank(ALICE); crowdfund.contribute{value: 1 ether}(id);
        // NOT past deadline
        assertFalse(crowdfund.isFailed(id));
    }

    function test_timeLeft_before() public {
        uint256 id = _createDefaultCampaign();
        uint256 left = crowdfund.timeLeft(id);
        // Should be DURATION or DURATION-1 depending on block timestamp delta
        assertApproxEqAbs(left, DURATION, 1);
    }

    function test_timeLeft_after() public {
        uint256 id = _createDefaultCampaign();
        _passDeadline();
        assertEq(crowdfund.timeLeft(id), 0);
    }

    function test_getCampaign_revert_invalidId() public {
        vm.expectRevert(
            abi.encodeWithSelector(MiniCrowdfund.CampaignNotFound.selector, 0)
        );
        crowdfund.getCampaign(0);
    }

    function test_totalCampaigns() public {
        assertEq(crowdfund.totalCampaigns(), 0);
        _createDefaultCampaign();
        assertEq(crowdfund.totalCampaigns(), 1);
        _createDefaultCampaign();
        assertEq(crowdfund.totalCampaigns(), 2);
    }

    // =========================================================================
    //  6. Integration / end-to-end scenarios
    // =========================================================================

    /**
     * @notice Full happy path: create → contribute → meet goal → withdraw
     */
    function test_integration_successfulCampaign() public {
        // 1. Create
        uint256 id = _createDefaultCampaign();

        // 2. Contribute from multiple accounts
        vm.prank(ALICE); crowdfund.contribute{value: 5 ether}(id);
        vm.prank(BOB);   crowdfund.contribute{value: 5 ether}(id);

        // 3. Check state mid-campaign
        (, , , , , uint256 raised, ) = crowdfund.getCampaign(id);
        assertEq(raised, 10 ether);
        assertTrue(crowdfund.isSuccessful(id));

        // 4. Pass deadline
        _passDeadline();

        // 5. Withdraw
        uint256 balBefore = CREATOR.balance;
        vm.prank(CREATOR);
        crowdfund.withdraw(id);
        assertEq(CREATOR.balance, balBefore + 10 ether);

        // 6. Alice cannot refund because campaign succeeded
        vm.prank(ALICE);
        vm.expectRevert(
            abi.encodeWithSelector(MiniCrowdfund.CampaignSucceeded.selector, id)
        );
        crowdfund.refund(id);
    }

    /**
     * @notice Full failure path: create → contribute → miss goal → refund
     */
    function test_integration_failedCampaign() public {
        uint256 id = _createDefaultCampaign();

        vm.prank(ALICE); crowdfund.contribute{value: 2 ether}(id);
        vm.prank(BOB);   crowdfund.contribute{value: 2 ether}(id);
        // Raised only 4/10 ETH

        _passDeadline();
        assertTrue(crowdfund.isFailed(id));

        // Creator cannot withdraw
        vm.prank(CREATOR);
        vm.expectRevert(
            abi.encodeWithSelector(
                MiniCrowdfund.GoalNotReached.selector,
                GOAL,
                4 ether
            )
        );
        crowdfund.withdraw(id);

        // Both contributors get refunds
        uint256 aliceBefore = ALICE.balance;
        uint256 bobBefore   = BOB.balance;
        vm.prank(ALICE); crowdfund.refund(id);
        vm.prank(BOB);   crowdfund.refund(id);

        assertEq(ALICE.balance, aliceBefore + 2 ether);
        assertEq(BOB.balance,   bobBefore   + 2 ether);
        assertEq(address(crowdfund).balance, 0);
    }

    /**
     * @notice Exceeding goal is fine – creator withdraws the overfunded amount.
     */
    function test_integration_overfunded() public {
        uint256 id = _createDefaultCampaign();

        vm.prank(ALICE); crowdfund.contribute{value: 15 ether}(id); // 5 over goal
        _passDeadline();

        uint256 balBefore = CREATOR.balance;
        vm.prank(CREATOR);
        crowdfund.withdraw(id);

        assertEq(CREATOR.balance, balBefore + 15 ether);
    }

    /**
     * @notice Multiple independent campaigns can run concurrently.
     */
    function test_integration_twoCampaignsConcurrent() public {
        vm.prank(CREATOR);
        uint256 id0 = crowdfund.createCampaign("Camp A", "...", 5 ether, DURATION);
        vm.prank(BOB);
        uint256 id1 = crowdfund.createCampaign("Camp B", "...", 3 ether, DURATION);

        vm.prank(ALICE); crowdfund.contribute{value: 5 ether}(id0); // fund A fully
        vm.prank(CAROL); crowdfund.contribute{value: 1 ether}(id1); // fund B partially

        _passDeadline();

        // A succeeded – CREATOR withdraws
        vm.prank(CREATOR);
        crowdfund.withdraw(id0);

        // B failed – CAROL gets refund
        vm.prank(CAROL);
        crowdfund.refund(id1);

        assertEq(address(crowdfund).balance, 0);
    }

    // =========================================================================
    //  7. Fuzz tests
    // =========================================================================

    /**
     * @notice Fuzz: any valid goal and duration should create a campaign.
     * @dev    Forge will generate hundreds of random (goal, duration) pairs.
     */
    function testFuzz_createCampaign(uint256 goal, uint256 duration) public {
        // Bound inputs to valid ranges to avoid overflow
        goal     = bound(goal,     1,                  100_000 ether);
        duration = bound(duration, crowdfund.MIN_DURATION(), 365 days);

        vm.prank(CREATOR);
        uint256 id = crowdfund.createCampaign("Fuzz", "fuzz", goal, duration);

        (, , , uint256 storedGoal, , , ) = crowdfund.getCampaign(id);
        assertEq(storedGoal, goal);
    }

    /**
     * @notice Fuzz: any valid contribution should accumulate correctly.
     */
    function testFuzz_contribute(uint96 amount) public {
        // uint96 to avoid overflow when dealing ETH
        vm.assume(amount > 0);
        uint256 id = _createDefaultCampaign();

        vm.deal(ALICE, amount);
        vm.prank(ALICE);
        crowdfund.contribute{value: amount}(id);

        assertEq(crowdfund.getContribution(id, ALICE), amount);
    }
}
