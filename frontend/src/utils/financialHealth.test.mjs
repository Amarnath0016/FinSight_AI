
import test from "node:test";
import assert from "node:assert/strict";

import {
  calculateFinancialHealth,
} from "./financialHealth.mjs";

test("calculates the maximum score for strong recorded cash flow", () => {
  const result = calculateFinancialHealth([
    { type: "income", amount: 40000 },
    { type: "expense", amount: 18000 },
  ]);

  assert.equal(result.totalIncome, 40000);
  assert.equal(result.totalExpenses, 18000);
  assert.equal(result.netSavings, 22000);
  assert.ok(Math.abs(result.savingsRate - 55) < 1e-9);
  assert.ok(Math.abs(result.expenseRatio - 45) < 1e-9);
  assert.equal(result.score, 100);
  assert.equal(result.label, "Strong");
});

test("calculates a fair score for moderate savings", () => {
  const result = calculateFinancialHealth([
    { type: "income", amount: 10000 },
    { type: "expense", amount: 8500 },
  ]);

  assert.equal(result.savingsRate, 15);
  assert.equal(result.expenseRatio, 85);
  assert.equal(result.score, 60);
  assert.equal(result.label, "Fair");
});

test("assigns zero points when expenses exceed income", () => {
  const result = calculateFinancialHealth([
    { type: "income", amount: 10000 },
    { type: "expense", amount: 12000 },
  ]);

  assert.equal(result.netSavings, -2000);
  assert.equal(result.score, 0);
  assert.equal(result.label, "At risk");
  assert.ok(
    result.insights.some((item) =>
      item.title.includes("Expenses exceed income")
    )
  );
});

test("returns no score when income is missing", () => {
  const result = calculateFinancialHealth([
    { type: "expense", amount: 500 },
  ]);

  assert.equal(result.score, null);
  assert.equal(result.label, "Not enough data");
  assert.equal(result.savingsRate, null);
  assert.equal(result.expenseRatio, null);
});

test("returns no score for an empty transaction list", () => {
  const result = calculateFinancialHealth([]);

  assert.equal(result.score, null);
  assert.equal(result.totalIncome, 0);
  assert.equal(result.totalExpenses, 0);
});

test("handles a non-array input safely", () => {
  const result = calculateFinancialHealth(null);

  assert.equal(result.score, null);
  assert.equal(result.transactionCount, 0);
});

test("ignores invalid types, negative amounts, and non-finite amounts", () => {
  const result = calculateFinancialHealth([
    { type: "income", amount: 10000 },
    { type: "expense", amount: 2000 },
    { type: "expense", amount: -500 },
    { type: "income", amount: "not-a-number" },
    { type: "transfer", amount: 9000 },
  ]);

  assert.equal(result.totalIncome, 10000);
  assert.equal(result.totalExpenses, 2000);
  assert.equal(result.transactionCount, 2);
});

test("calculates a score when income exists but no expenses are recorded", () => {
  const result = calculateFinancialHealth([
    { type: "income", amount: 20000 },
  ]);

  assert.equal(result.netSavings, 20000);
  assert.equal(result.savingsRate, 100);
  assert.equal(result.expenseRatio, 0);
  assert.equal(result.score, 100);
});

test("does not award the maximum savings points at a zero savings rate", () => {
  const result = calculateFinancialHealth([
    { type: "income", amount: 10000 },
    { type: "expense", amount: 10000 },
  ]);

  assert.equal(result.savingsRate, 0);
  assert.equal(result.score, 25);
});

test("returns the score breakdown and explanatory insights", () => {
  const result = calculateFinancialHealth([
    { type: "income", amount: 50000 },
    { type: "expense", amount: 30000 },
  ]);

  assert.equal(result.breakdown.length, 2);
  assert.equal(
    result.breakdown.reduce((sum, item) => sum + item.maxPoints, 0),
    100
  );
  assert.ok(result.insights.length > 0);
  assert.ok(result.insights.every((item) => item.message.length > 0));
});
