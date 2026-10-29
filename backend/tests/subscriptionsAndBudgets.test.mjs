import test from "node:test";
import assert from "node:assert/strict";
import {
  detectSubscriptions,
  normalizeSubscriptionTitle,
} from "../src/services/subscription.service.js";
import { calculateBudgetPacing } from "../src/services/budget.service.js";
import {
  upsertBudget,
  deleteBudget,
} from "../src/controllers/budgetController.js";
import ApiError from "../src/utils/ApiError.js";

// Mock recurring expense data
const sampleSubscriptionTransactions = [
  // Netflix recurring monthly charges
  { type: "expense", title: "Netflix Subscription", amount: 649, category: "Entertainment", date: "2026-01-05" },
  { type: "expense", title: "Netflix Monthly Plan", amount: 649, category: "Entertainment", date: "2026-02-05" },
  { type: "expense", title: "Netflix.com Recurring", amount: 799, category: "Entertainment", date: "2026-03-05" }, // Price creep!

  // Spotify recurring monthly charges
  { type: "expense", title: "Spotify Premium", amount: 119, category: "Entertainment", date: "2026-01-15" },
  { type: "expense", title: "Spotify Premium", amount: 119, category: "Entertainment", date: "2026-02-15" },
  { type: "expense", title: "Spotify Premium", amount: 119, category: "Entertainment", date: "2026-03-15" },

  // One-off non-recurring expense
  { type: "expense", title: "Zara Jacket", amount: 4500, category: "Shopping", date: "2026-02-18" },
];

test("normalizeSubscriptionTitle cleans noise words while preserving service name", () => {
  assert.equal(normalizeSubscriptionTitle("Netflix Monthly Subscription"), "Netflix");
  assert.equal(normalizeSubscriptionTitle("Spotify Premium Membership"), "Spotify Premium");
  assert.equal(normalizeSubscriptionTitle("Airtel Fiber Auto-Debit Bill"), "Airtel Fiber");
});

test("detectSubscriptions identifies recurring monthly patterns and price creep", () => {
  const result = detectSubscriptions(sampleSubscriptionTransactions);

  assert.equal(result.subscriptionCount, 2);
  assert.equal(result.subscriptions.length, 2);

  // Netflix should have price creep detected (649 -> 799)
  const netflix = result.subscriptions.find((s) => s.name.toLowerCase().includes("netflix"));
  assert.ok(netflix, "Should detect Netflix subscription");
  assert.equal(netflix.monthlyAmount, 799);
  assert.ok(netflix.priceChange, "Should flag price change for Netflix");
  assert.equal(netflix.priceChange.previousAmount, 649);
  assert.equal(netflix.priceChange.currentAmount, 799);
  assert.equal(netflix.priceChange.delta, 150);

  // Spotify has steady price
  const spotify = result.subscriptions.find((s) => s.name.toLowerCase().includes("spotify"));
  assert.ok(spotify, "Should detect Spotify subscription");
  assert.equal(spotify.monthlyAmount, 119);
  assert.equal(spotify.priceChange, null);

  // Total monthly commitment = 799 + 119 = 918
  assert.equal(result.totalMonthlyCommitment, 918);
  assert.equal(result.totalAnnualCommitment, 918 * 12);
  assert.ok(result.insights.length > 0);
});

test("detectSubscriptions safely handles empty datasets", () => {
  const result = detectSubscriptions([]);
  assert.equal(result.subscriptionCount, 0);
  assert.equal(result.totalMonthlyCommitment, 0);
  assert.deepEqual(result.subscriptions, []);
});

test("calculateBudgetPacing calculates daily burn rate and end-of-month projections", () => {
  const budgets = [
    { category: "Food & Dining", monthlyLimit: 10000 },
    { category: "Shopping", monthlyLimit: 5000 },
  ];

  // Simulating Day 15 of a 30-day month (50% through the month)
  const midMonthDate = new Date("2026-04-15T12:00:00Z");

  const currentMonthTx = [
    // Spent 7,000 on Food in first 15 days -> Projected 14,000 -> Exceeds 10,000 budget!
    { type: "expense", category: "Food & Dining", amount: 4000, date: "2026-04-03" },
    { type: "expense", category: "Food & Dining", amount: 3000, date: "2026-04-10" },

    // Spent 1,500 on Shopping in first 15 days -> Projected 3,000 -> Under 5,000 budget!
    { type: "expense", category: "Shopping", amount: 1500, date: "2026-04-05" },
  ];

  const report = calculateBudgetPacing(budgets, currentMonthTx, midMonthDate);

  assert.equal(report.asOfDay, 15);
  assert.equal(report.daysInMonth, 30);
  assert.equal(report.totalBudget, 15000);
  assert.equal(report.totalSpent, 8500);

  const foodReport = report.categoryBudgets.find((b) => b.category === "Food & Dining");
  assert.equal(foodReport.spent, 7000);
  assert.equal(foodReport.status, "at_risk"); // Pacing fast (projected 14,000 vs 10,000 limit)
  assert.ok(foodReport.projectedMonthEnd > foodReport.monthlyLimit);

  const shoppingReport = report.categoryBudgets.find((b) => b.category === "Shopping");
  assert.equal(shoppingReport.spent, 1500);
  assert.equal(shoppingReport.status, "on_track"); // Projected 3,000 vs 5,000 limit
});

test("upsertBudget controller validates category and positive limit", async () => {
  const mockReq = {
    user: { id: "64e0a1b2c3d4e5f6a7b8c901" },
    body: { category: "", monthlyLimit: -100 },
  };
  const mockRes = {};
  let caughtError = null;

  await upsertBudget(mockReq, mockRes, (err) => {
    caughtError = err;
  });

  assert.ok(caughtError instanceof ApiError);
  assert.equal(caughtError.statusCode, 400);
  assert.match(caughtError.message, /Category name is required/i);
});

test("deleteBudget controller rejects malformed ObjectId format", async () => {
  const mockReq = {
    user: { id: "64e0a1b2c3d4e5f6a7b8c901" },
    params: { id: "invalid-budget-id" },
  };
  const mockRes = {};
  let caughtError = null;

  await deleteBudget(mockReq, mockRes, (err) => {
    caughtError = err;
  });

  assert.ok(caughtError instanceof ApiError);
  assert.equal(caughtError.statusCode, 400);
  assert.match(caughtError.message, /Invalid budget ID format/i);
});
