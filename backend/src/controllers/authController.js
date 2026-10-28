const jwt = require("jsonwebtoken");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { JWT_SECRET } = require("../middleware/auth.middleware");

function validateEmail(email) {
  return (
    typeof email === "string" &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  );
}

function validateRegisterInput(body = {}) {
  const { name, email, password } = body;

  const validName =
    typeof name === "string" &&
    name.trim().length >= 2 &&
    name.trim().length <= 60;

  const validEmail = validateEmail(email);

  const validPassword =
    typeof password === "string" && password.length >= 6;

  return validName && validEmail && validPassword;
}

function validateLoginInput(body = {}) {
  const { email, password } = body;
  return validateEmail(email) && typeof password === "string" && password.length > 0;
}

function generateToken(user) {
  return jwt.sign(
    {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role || "user",
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

// POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  if (!validateRegisterInput(req.body)) {
    throw ApiError.badRequest(
      "Please provide a valid name (2-60 chars), valid email, and password (min 6 chars)."
    );
  }

  const email = req.body.email.trim().toLowerCase();
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new ApiError(409, "An account with this email address already exists.");
  }

  const user = await User.create({
    name: req.body.name.trim(),
    email,
    password: req.body.password,
  });

  const token = generateToken(user);

  return res.status(201).json({
    success: true,
    message: "Account registered successfully.",
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  if (!validateLoginInput(req.body)) {
    throw ApiError.badRequest("Please provide a valid email and password.");
  }

  const email = req.body.email.trim().toLowerCase();
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    throw new ApiError(401, "Invalid email or password.");
  }

  const isMatch = await user.matchPassword(req.body.password);
  if (!isMatch) {
    throw new ApiError(401, "Invalid email or password.");
  }

  const token = generateToken(user);

  return res.status(200).json({
    success: true,
    message: "Logged in successfully.",
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

// GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");

  if (!user) {
    throw ApiError.notFound("User not found.");
  }

  return res.status(200).json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

// POST /api/auth/logout
const logout = asyncHandler(async (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Logged out successfully.",
  });
});

module.exports = {
  validateEmail,
  validateRegisterInput,
  validateLoginInput,
  generateToken,
  register,
  login,
  getMe,
  logout,
};
