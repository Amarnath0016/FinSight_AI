import test from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  validateEmail,
  validateRegisterInput,
  validateLoginInput,
  generateToken,
} from "../src/controllers/authController.js";
import { protect, JWT_SECRET } from "../src/middleware/auth.middleware.js";
import ApiError from "../src/utils/ApiError.js";

const mockUser = {
  _id: "507f1f77bcf86cd799439011",
  name: "John Investor",
  email: "john@example.com",
  role: "user",
};

test("validateEmail correctly identifies valid and invalid emails", () => {
  assert.equal(validateEmail("user@example.com"), true);
  assert.equal(validateEmail("investor.pro@domain.co.in"), true);
  assert.equal(validateEmail("invalid-email"), false);
  assert.equal(validateEmail("user@"), false);
  assert.equal(validateEmail("@domain.com"), false);
  assert.equal(validateEmail(""), false);
  assert.equal(validateEmail(null), false);
});

test("validateRegisterInput checks name, email and password constraints", () => {
  assert.equal(
    validateRegisterInput({
      name: "John Doe",
      email: "john@example.com",
      password: "Password123!",
    }),
    true
  );

  // Short name
  assert.equal(
    validateRegisterInput({
      name: "J",
      email: "john@example.com",
      password: "Password123!",
    }),
    false
  );

  // Short password (<6 chars)
  assert.equal(
    validateRegisterInput({
      name: "John Doe",
      email: "john@example.com",
      password: "123",
    }),
    false
  );

  // Invalid email
  assert.equal(
    validateRegisterInput({
      name: "John Doe",
      email: "not-an-email",
      password: "Password123!",
    }),
    false
  );
});

test("validateLoginInput requires email and password", () => {
  assert.equal(
    validateLoginInput({
      email: "user@example.com",
      password: "SecretPassword123",
    }),
    true
  );
  assert.equal(validateLoginInput({ email: "", password: "123" }), false);
  assert.equal(validateLoginInput({ email: "user@example.com", password: "" }), false);
});

test("generateToken produces a valid verifiable JWT with user payload", () => {
  const token = generateToken(mockUser);
  assert.ok(typeof token === "string" && token.length > 20);

  const decoded = jwt.verify(token, JWT_SECRET);
  assert.equal(decoded.id, mockUser._id);
  assert.equal(decoded.email, mockUser.email);
  assert.equal(decoded.name, mockUser.name);
  assert.equal(decoded.role, mockUser.role);
});

test("bcrypt password hashing and comparison work accurately", async () => {
  const plainPassword = "SuperSecretPassword123!";
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(plainPassword, salt);

  assert.notEqual(hash, plainPassword);
  assert.equal(await bcrypt.compare(plainPassword, hash), true);
  assert.equal(await bcrypt.compare("WrongPassword", hash), false);
});

test("protect middleware rejects request with missing Authorization header", async () => {
  const req = { headers: {} };
  const res = {};
  let caughtError = null;

  try {
    await protect(req, res, (err) => {
      caughtError = err;
    });
  } catch (err) {
    caughtError = err;
  }

  assert.ok(caughtError instanceof ApiError);
  assert.equal(caughtError.statusCode, 401);
  assert.match(caughtError.message, /authentication token missing/i);
});

test("protect middleware rejects request with malformed or invalid token", async () => {
  const req = { headers: { authorization: "Bearer invalid.token.string" } };
  const res = {};
  let caughtError = null;

  try {
    await protect(req, res, (err) => {
      caughtError = err;
    });
  } catch (err) {
    caughtError = err;
  }

  assert.ok(caughtError instanceof ApiError);
  assert.equal(caughtError.statusCode, 401);
  assert.match(caughtError.message, /Invalid authentication token/i);
});

test("protect middleware allows valid token and attaches user to req", async () => {
  const token = generateToken(mockUser);
  const req = { headers: { authorization: `Bearer ${token}` } };
  const res = {};
  let nextCalled = false;

  await protect(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.ok(req.user);
  assert.equal(req.user.id, mockUser._id);
  assert.equal(req.user.email, mockUser.email);
});
