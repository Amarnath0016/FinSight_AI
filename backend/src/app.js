const express = require("express");
const cors = require("cors");
const healthRoutes = require("./routes/healthRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const notFound = require("./middleware/notFound.middleware");
const errorHandler = require("./middleware/error.middleware");

const app = express();

const allowedOrigin = process.env.CLIENT_URL || "http://localhost:5173";

app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
  })
);

app.use(express.json({ limit: "1mb" }));

app.get("/", (req, res) => {
  res.status(200).json({
    name: "FinSight AI API",
    status: "online",
    message: "Welcome to FinSight AI API",
    version: "1.0.0",
  });
});

app.use("/api/health", healthRoutes);
app.use("/api/transactions", transactionRoutes);

// 404 handler for unmatched routes
app.use(notFound);

// Centralized error handler
app.use(errorHandler);

module.exports = app;
