import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeHeader,
  normalizeDate,
  parseAndValidateCsv,
} from "../src/services/csv.service.js";

test("normalizeHeader maps various synonyms to standard keys", () => {
  assert.equal(normalizeHeader("Transaction Date"), "date");
  assert.equal(normalizeHeader("Date"), "date");
  assert.equal(normalizeHeader("Description"), "title");
  assert.equal(normalizeHeader("Merchant"), "title");
  assert.equal(normalizeHeader("Payee"), "title");
  assert.equal(normalizeHeader("Amount"), "amount");
  assert.equal(normalizeHeader("Cost"), "amount");
  assert.equal(normalizeHeader("Transaction Type"), "type");
  assert.equal(normalizeHeader("Category"), "category");
});

test("normalizeDate standardizes various date formats to ISO YYYY-MM-DD", () => {
  assert.equal(normalizeDate("2026-10-15"), "2026-10-15");
  assert.equal(normalizeDate("15/10/2026"), "2026-10-15");
  assert.equal(normalizeDate("15-10-2026"), "2026-10-15");
  assert.equal(normalizeDate("32/13/2026"), null);
  assert.equal(normalizeDate("invalid"), null);
  assert.equal(normalizeDate(""), null);
});

test("parseAndValidateCsv parses a valid CSV correctly", () => {
  const csv = `Date,Description,Amount,Type,Category
2026-10-01,Monthly Salary,60000,income,Salary
2026-10-02,Groceries,3500.50,expense,Food
2026-10-05,Electricity Bill,1800,expense,Utilities`;

  const result = parseAndValidateCsv(csv);

  assert.equal(result.totalRows, 3);
  assert.equal(result.validTransactions.length, 3);
  assert.equal(result.invalidRows.length, 0);
  assert.equal(result.duplicateCount, 0);

  assert.deepEqual(result.validTransactions[0], {
    title: "Monthly Salary",
    amount: 60000,
    type: "income",
    category: "Salary",
    date: "2026-10-01",
  });
});

test("parseAndValidateCsv detects invalid rows, missing fields, and duplicates", () => {
  const mixedCsv = `Date,Title,Amount,Type,Category
2026-10-01,Valid Salary,50000,income,Salary
2026-10-02,,2500,expense,Shopping
2026-10-03,Invalid Amount,-500,expense,Food
32/13/2026,Bad Date,1000,expense,Utilities
2026-10-05,Weekend Outing,3000,expense,Fun
2026-10-05,Weekend Outing,3000,expense,Fun`;

  const result = parseAndValidateCsv(mixedCsv);

  assert.equal(result.totalRows, 6);
  assert.equal(result.validTransactions.length, 2); // Valid Salary, first Weekend Outing
  assert.equal(result.invalidRows.length, 4); // Missing title, negative amount, bad date, duplicate
  assert.equal(result.duplicateCount, 1);

  // Verify specific error reasons
  assert.ok(
    result.invalidRows.some((r) =>
      r.reasons.some((msg) => msg.includes("Missing or empty transaction title"))
    )
  );
  assert.ok(
    result.invalidRows.some((r) =>
      r.reasons.some((msg) => msg.includes("positive finite number"))
    )
  );
  assert.ok(
    result.invalidRows.some((r) =>
      r.reasons.some((msg) => msg.includes("Invalid or unparseable date"))
    )
  );
  assert.ok(
    result.invalidRows.some((r) =>
      r.reasons.some((msg) => msg.includes("Duplicate transaction detected"))
    )
  );
});

test("parseAndValidateCsv handles empty CSV content safely", () => {
  const emptyResult = parseAndValidateCsv("");
  assert.equal(emptyResult.totalRows, 0);
  assert.equal(emptyResult.validTransactions.length, 0);
  assert.equal(emptyResult.invalidRows.length, 0);
});
