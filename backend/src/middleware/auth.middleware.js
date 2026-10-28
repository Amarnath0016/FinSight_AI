const jwt = require("jsonwebtoken");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

const JWT_SECRET =
  process.env.JWT_SECRET || "finsight-dev-secret-key-change-in-production";

const protect = asyncHandler(async (req, res, next) => {
  let token;

  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  }

  if (!token) {
    throw new ApiError(401, "Not authorized, authentication token missing");
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Attach authenticated user information to request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role || "user",
    };

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new ApiError(401, "Authentication token has expired. Please log in again.");
    }
    throw new ApiError(401, "Invalid authentication token. Authorization denied.");
  }
});

module.exports = {
  protect,
  JWT_SECRET,
};
