import test from "node:test";
import assert from "node:assert/strict";
import {
  validateTransaction,
  buildTransactionData,
} from "../src/controllers/transactionController.js";

const validPayload = {
  title: "Grocery Shopping",
  amount: 2500.5,
  type: "expense",
  category: "Food",
  date: "2026-10-15",
};

test("validates a standard valid transaction payload", () => {
  assert.equal(validateTransaction(validPayload), true);
});

test("validates an income transaction", () => {
  assert.equal(
    validateTransaction({
      ...validPayload,
      type: "income",
      category: "Salary",
    }),
    true
  );
});

test("rejects empty title or whitespace-only title", () => {
  assert.equal(
    validateTransaction({ ...validPayload, title: "" }),
    false
  );
  assert.equal(
    validateTransaction({ ...validPayload, title: "   " }),
    false
  );
});

test("rejects titles exceeding 150 characters", () => {
  assert.equal(
    validateTransaction({ ...validPayload, title: "a".repeat(151) }),
    false
  );
});

test("rejects invalid, negative, or zero amounts", () => {
  assert.equal(
    validateTransaction({ ...validPayload, amount: 0 }),
    false
  );
  assert.equal(
    validateTransaction({ ...validPayload, amount: -100 }),
    false
  );
  assert.equal(
    validateTransaction({ ...validPayload, amount: "not-a-number" }),
    false
  );
  assert.equal(
    validateTransaction({ ...validPayload, amount: null }),
    false
  );
  assert.equal(
    validateTransaction({ ...validPayload, amount: Infinity }),
    false
  );
});

test("rejects unsupported transaction types", () => {
  assert.equal(
    validateTransaction({ ...validPayload, type: "transfer" }),
    false
  );
  assert.equal(
    validateTransaction({ ...validPayload, type: "investment" }),
    false
  );
  assert.equal(
    validateTransaction({ ...validPayload, type: "" }),
    false
  );
});

test("rejects empty or whitespace-only category", () => {
  assert.equal(
    validateTransaction({ ...validPayload, category: "" }),
    false
  );
  assert.equal(
    validateTransaction({ ...validPayload, category: "   " }),
    false
  );
});

test("rejects invalid date formats and impossible calendar dates", () => {
  assert.equal(
    validateTransaction({ ...validPayload, date: "15-10-2026" }),
    false
  );
  assert.equal(
    validateTransaction({ ...validPayload, date: "2026/10/15" }),
    false
  );
  assert.equal(
    validateTransaction({ ...validPayload, date: "invalid-date" }),
    false
  );
  assert.equal(
    validateTransaction({ ...validPayload, date: "2026-02-30" }),
    false
  );
});

test("buildTransactionData trims string fields and casts amount to Number", () => {
  const result = buildTransactionData({
    title: "  Electric Bill  ",
    amount: "1500",
    type: "expense",
    category: " Utilities  ",
    date: "2026-10-10",
  });

  assert.deepEqual(result, {
    title: "Electric Bill",
    amount: 1500,
    type: "expense",
    category: "Utilities",
    date: "2026-10-10",
  });
});
