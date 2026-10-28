import test from "node:test";
import assert from "node:assert/strict";
import {
  computeUserSpendingFeatures,
  requestMlSegmentation,
} from "../src/services/ml.service.js";

const sampleTransactions = [
  { date: "2026-10-01", amount: 60000, type: "income", category: "Salary" },
  { date: "2026-10-02", amount: 18000, type: "expense", category: "Housing" },
  { date: "2026-10-05", amount: 4000, type: "expense", category: "Food" }, // Discretionary
  { date: "2026-10-10", amount: 2000, type: "expense", category: "Entertainment" }, // Discretionary
  { date: "2026-10-15", amount: 2000, type: "expense", category: "Utilities" },
];

test("computeUserSpendingFeatures accurately computes rates, ratios, and averages", () => {
  const features = computeUserSpendingFeatures(sampleTransactions);

  assert.equal(features.monthly_income, 60000);
  assert.equal(features.monthly_expense, 26000);
  assert.equal(features.savings_rate, 56.67); // (60000 - 26000)/60000 = 56.67%
  assert.equal(features.expense_ratio, 43.33); // 26000/60000 = 43.33%
  assert.equal(features.discretionary_ratio, 0.23); // (4000 + 2000)/26000 = 23%
  assert.equal(features.months_analyzed, 1);
  assert.equal(features.total_transactions, 5);
});

test("computeUserSpendingFeatures handles empty transactions safely", () => {
  const features = computeUserSpendingFeatures([]);

  assert.equal(features.monthly_income, 0);
  assert.equal(features.monthly_expense, 0);
  assert.equal(features.savings_rate, 0);
  assert.equal(features.expense_ratio, 100);
  assert.equal(features.total_transactions, 0);
});

test("computeUserSpendingFeatures handles zero income without division by zero", () => {
  const features = computeUserSpendingFeatures([
    { date: "2026-10-01", amount: 5000, type: "expense", category: "Food" },
  ]);

  assert.equal(features.monthly_income, 0);
  assert.equal(features.monthly_expense, 5000);
  assert.equal(features.savings_rate, 0);
  assert.equal(features.expense_ratio, 100);
});

test("requestMlSegmentation provides graceful fallback when Python service is offline", async () => {
  // Test with dummy port where no server is running
  const features = {
    monthly_income: 80000,
    monthly_expense: 30000,
    savings_rate: 62.5,
    expense_ratio: 37.5,
    discretionary_ratio: 0.18,
  };

  const result = await requestMlSegmentation(features);

  assert.ok(result);
  assert.equal(result.available, false);
  assert.equal(result.cluster_name, "Disciplined Saver");
  assert.match(result.recommendation, /resilience/i);
});
