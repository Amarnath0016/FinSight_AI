import test from "node:test";
import assert from "node:assert/strict";
import notFound from "../src/middleware/notFound.middleware.js";
import errorHandler from "../src/middleware/error.middleware.js";
import ApiError from "../src/utils/ApiError.js";
import {
  addTransaction,
  updateTransaction,
  deleteTransaction,
} from "../src/controllers/transactionController.js";

function createMockRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
  };
}

test("notFound middleware returns standard 404 JSON response", () => {
  const req = { method: "GET", originalUrl: "/api/unknown-endpoint" };
  const res = createMockRes();

  notFound(req, res, () => {});

  assert.equal(res.statusCode, 404);
  assert.equal(res.body.success, false);
  assert.match(res.body.message, /Route not found/);
});

test("errorHandler middleware handles custom ApiError with correct status code", () => {
  const customError = ApiError.badRequest("Validation failed on input");
  const req = { method: "POST", originalUrl: "/api/transactions" };
  const res = createMockRes();

  errorHandler(customError, req, res, () => {});

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
  assert.equal(res.body.message, "Validation failed on input");
});

test("errorHandler middleware falls back to 500 for generic internal errors", () => {
  const genericError = new Error("Database network failure");
  const req = { method: "GET", originalUrl: "/api/transactions" };
  const res = createMockRes();

  errorHandler(genericError, req, res, () => {});

  assert.equal(res.statusCode, 500);
  assert.equal(res.body.success, false);
  assert.equal(res.body.message, "Database network failure");
});

test("addTransaction controller rejects invalid payload with 400 Bad Request", async () => {
  const req = { body: { title: "", amount: -50 } };
  const res = createMockRes();
  let caughtError = null;

  try {
    await addTransaction(req, res, (err) => {
      caughtError = err;
    });
  } catch (err) {
    caughtError = err;
  }

  assert.ok(caughtError instanceof ApiError);
  assert.equal(caughtError.statusCode, 400);
  assert.match(caughtError.message, /Please provide valid transaction details/);
});

test("updateTransaction controller rejects malformed ObjectId with 400 Bad Request", async () => {
  const req = {
    params: { id: "not-an-object-id" },
    body: {
      title: "Valid Title",
      amount: 100,
      type: "expense",
      category: "Food",
      date: "2026-10-15",
    },
  };
  const res = createMockRes();
  let caughtError = null;

  try {
    await updateTransaction(req, res, (err) => {
      caughtError = err;
    });
  } catch (err) {
    caughtError = err;
  }

  assert.ok(caughtError instanceof ApiError);
  assert.equal(caughtError.statusCode, 400);
  assert.equal(caughtError.message, "Invalid transaction ID");
});

test("deleteTransaction controller rejects malformed ObjectId with 400 Bad Request", async () => {
  const req = {
    params: { id: "12345" },
  };
  const res = createMockRes();
  let caughtError = null;

  try {
    await deleteTransaction(req, res, (err) => {
      caughtError = err;
    });
  } catch (err) {
    caughtError = err;
  }

  assert.ok(caughtError instanceof ApiError);
  assert.equal(caughtError.statusCode, 400);
  assert.equal(caughtError.message, "Invalid transaction ID");
});
