import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateBaselineMetrics,
  computeScenarioSimulation,
} from "../src/services/simulation.service.js";
import {
  runSimulation,
  saveScenario,
  getSavedScenarios,
  deleteScenario,
} from "../src/controllers/simulationController.js";
import ApiError from "../src/utils/ApiError.js";

// Mock transaction dataset
const sampleTransactions = [
  { type: "income", amount: 60000, category: "Salary", date: "2026-01-05" },
  { type: "income", amount: 10000, category: "Freelance", date: "2026-01-20" },
  { type: "expense", amount: 15000, category: "Rent", date: "2026-01-06" },
  { type: "expense", amount: 12000, category: "Food & Dining", date: "2026-01-12" },
  { type: "expense", amount: 8000, category: "Shopping", date: "2026-01-18" },
  { type: "expense", amount: 5000, category: "Utilities", date: "2026-01-25" },
];

test("calculateBaselineMetrics aggregates income, expenses, and monthly rates", () => {
  const baseline = calculateBaselineMetrics(sampleTransactions);

  assert.equal(baseline.hasData, true);
  assert.equal(baseline.totalIncome, 70000);
  assert.equal(baseline.totalExpenses, 40000);
  assert.equal(baseline.monthlyIncome, 70000);
  assert.equal(baseline.monthlyExpenses, 40000);
  assert.equal(baseline.monthlySavings, 30000);
  assert.equal(baseline.savingsRate, 42.9);
  assert.equal(baseline.health.score !== null, true);
  assert.equal(baseline.categories.length, 4);
});

test("calculateBaselineMetrics safely handles empty transaction sets", () => {
  const baseline = calculateBaselineMetrics([]);
  assert.equal(baseline.hasData, false);
  assert.equal(baseline.totalIncome, 0);
  assert.equal(baseline.totalExpenses, 0);
  assert.equal(baseline.monthlySavings, 0);
  assert.equal(baseline.savingsRate, 0);
  assert.equal(baseline.health.score, null);
  assert.deepEqual(baseline.categories, []);
});

test("computeScenarioSimulation models income raise and category cuts accurately", () => {
  const baseline = calculateBaselineMetrics(sampleTransactions);

  // Scenario: 10% income raise (+₹7,000) and -25% cut in Food & Dining
  const adjustments = {
    monthlyIncomeDelta: 0,
    incomePercentChange: 10,
    categoryAdjustments: {
      "Food & Dining": -25, // 12,000 -> 9,000 (-3,000)
    },
    additionalMonthlyExpense: 0,
  };

  const simulation = computeScenarioSimulation(baseline, adjustments);

  assert.equal(simulation.simulated.monthlyIncome, 77000); // 70000 * 1.10
  assert.equal(simulation.simulated.monthlyExpenses, 37000); // 40000 - 3000
  assert.equal(simulation.simulated.monthlySavings, 40000); // 77000 - 37000
  assert.equal(simulation.deltas.income, 7000);
  assert.equal(simulation.deltas.expenses, -3000);
  assert.equal(simulation.deltas.savings, 10000);
  assert.equal(simulation.deltas.annualSavings, 120000); // 10000 * 12
  assert.ok(simulation.simulated.savingsRate > baseline.savingsRate);
  assert.ok(simulation.insights.length > 0);
});

test("computeScenarioSimulation models new EMI expense and computes goal timeline", () => {
  const baseline = calculateBaselineMetrics(sampleTransactions);

  // Scenario: Add ₹10,000 car EMI, target ₹1,20,000 goal
  const adjustments = {
    monthlyIncomeDelta: 0,
    incomePercentChange: 0,
    categoryAdjustments: {},
    additionalMonthlyExpense: 10000,
    targetGoal: {
      name: "Emergency Reserve",
      targetAmount: 120000,
    },
  };

  const simulation = computeScenarioSimulation(baseline, adjustments);

  assert.equal(simulation.simulated.monthlyExpenses, 50000); // 40000 + 10000
  assert.equal(simulation.simulated.monthlySavings, 20000); // 70000 - 50000
  assert.equal(simulation.deltas.savings, -10000);
  assert.equal(simulation.deltas.annualSavings, -120000);

  // Baseline savings = 30,000/mo -> 120,000 / 30,000 = 4 months
  // Simulated savings = 20,000/mo -> 120,000 / 20,000 = 6 months
  // Months saved = 4 - 6 = -2 (takes 2 months longer)
  assert.equal(simulation.goalFeasibility.monthsToGoalBase, 4);
  assert.equal(simulation.goalFeasibility.monthsToGoalSim, 6);
  assert.equal(simulation.goalFeasibility.monthsSaved, -2);
});

test("computeScenarioSimulation detects deficit and flags warning insights", () => {
  const baseline = calculateBaselineMetrics(sampleTransactions);

  // Excessive new expense creating deficit: +₹40,000 expense -> total expenses 80,000 vs 70,000 income
  const adjustments = {
    monthlyIncomeDelta: 0,
    incomePercentChange: 0,
    categoryAdjustments: {},
    additionalMonthlyExpense: 40000,
  };

  const simulation = computeScenarioSimulation(baseline, adjustments);

  assert.equal(simulation.simulated.monthlySavings, -10000);
  const dangerInsight = simulation.insights.find((i) => i.type === "danger");
  assert.ok(dangerInsight, "Should generate danger insight when expenses exceed income");
});

test("saveScenario controller validates required scenario name", async () => {
  const mockReq = {
    user: { _id: "64e0a1b2c3d4e5f6a7b8c901" },
    body: { name: "   " },
  };
  const mockRes = {};
  let caughtError = null;

  await saveScenario(mockReq, mockRes, (err) => {
    caughtError = err;
  });

  assert.ok(caughtError instanceof ApiError);
  assert.equal(caughtError.statusCode, 400);
  assert.match(caughtError.message, /Scenario name is required/i);
});

test("simulation engine preserves immutability of input transaction records", () => {
  const transactionsCopy = JSON.parse(JSON.stringify(sampleTransactions));
  const baseline = calculateBaselineMetrics(transactionsCopy);
  const adjustments = {
    monthlyIncomeDelta: 5000,
    incomePercentChange: 15,
    categoryAdjustments: { "Food & Dining": -50 },
    additionalMonthlyExpense: 8000,
  };

  computeScenarioSimulation(baseline, adjustments);

  // Original records must remain completely unchanged
  assert.deepEqual(transactionsCopy, sampleTransactions);
  assert.equal(baseline.monthlyIncome, 70000);
  assert.equal(baseline.monthlyExpenses, 40000);
});

test("deleteScenario controller rejects malformed ObjectId format", async () => {
  const mockReq = {
    user: { _id: "64e0a1b2c3d4e5f6a7b8c901" },
    params: { id: "invalid-id-xyz" },
  };
  const mockRes = {};
  let caughtError = null;

  await deleteScenario(mockReq, mockRes, (err) => {
    caughtError = err;
  });

  assert.ok(caughtError instanceof ApiError);
  assert.equal(caughtError.statusCode, 400);
  assert.match(caughtError.message, /Invalid scenario ID format/i);
});
