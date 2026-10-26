
import test from "node:test";
import assert from "node:assert/strict";

import {
  filterTransactions,
  calculateFinancialSummary,
  getCategoryExpenseBreakdown,
  getUniqueCategories,
} from "./financialAnalytics.js";

const transactions = [
  {
    title: "Monthly salary",
    amount: 40000,
    type: "income",
    category: "Salary",
    date: "2026-10-01",
  },
  {
    title: "Groceries",
    amount: 3000,
    type: "expense",
    category: "Food",
    date: "2026-10-03",
  },
  {
    title: "Vegetables",
    amount: 1000,
    type: "expense",
    category: "Food",
    date: "2026-10-05",
  },
  {
    title: "Internet bill",
    amount: 1000,
    type: "expense",
    category: "Utilities",
    date: "2026-10-10",
  },
];

test("calculates income, expenses, savings and savings rate", () => {
  assert.deepEqual(calculateFinancialSummary(transactions), {
    totalIncome: 40000,
    totalExpenses: 5000,
    netSavings: 35000,
    savingsRate: 87.5,
  });
});

test("searches transaction titles without case sensitivity", () => {
  const result = filterTransactions(transactions, {
    search: "GROCERIES",
  });

  assert.equal(result.length, 1);
  assert.equal(result[0].title, "Groceries");
});

test("filters by transaction type and category", () => {
  const result = filterTransactions(transactions, {
    type: "expense",
    category: "Food",
  });

  assert.equal(result.length, 2);
  assert.ok(result.every((item) => item.type === "expense"));
});

test("includes both date-range boundaries", () => {
  const result = filterTransactions(transactions, {
    startDate: "2026-10-03",
    endDate: "2026-10-05",
  });

  assert.deepEqual(
    result.map((item) => item.title),
    ["Groceries", "Vegetables"]
  );
});

test("returns no results for a reversed date range", () => {
  assert.deepEqual(
    filterTransactions(transactions, {
      startDate: "2026-10-10",
      endDate: "2026-10-01",
    }),
    []
  );
});

test("handles an empty dataset and zero income", () => {
  assert.deepEqual(calculateFinancialSummary([]), {
    totalIncome: 0,
    totalExpenses: 0,
    netSavings: 0,
    savingsRate: 0,
  });

  assert.equal(
    calculateFinancialSummary([
      {
        amount: 500,
        type: "expense",
      },
    ]).savingsRate,
    0
  );
});

test("aggregates category totals and percentages", () => {
  const result = getCategoryExpenseBreakdown(transactions);

  assert.deepEqual(result, [
    { category: "Food", amount: 4000, percentage: 80 },
    { category: "Utilities", amount: 1000, percentage: 20 },
  ]);
});

test("returns sorted unique categories", () => {
  assert.deepEqual(
    getUniqueCategories(transactions),
    ["Food", "Salary", "Utilities"]
  );
});

test("returns no category breakdown when there are no expenses", () => {
  assert.deepEqual(
    getCategoryExpenseBreakdown([
      {
        amount: 40000,
        type: "income",
        category: "Salary",
      },
    ]),
    []
  );
});
