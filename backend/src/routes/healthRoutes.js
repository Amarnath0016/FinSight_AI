const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

const DB_STATES = {
  0: "disconnected",
  1: "connected",
  2: "connecting",
  3: "disconnecting",
};

router.get("/", (req, res) => {
  const readyState = mongoose.connection.readyState;
  const dbStatus = DB_STATES[readyState] || "unknown";

  res.status(200).json({
    success: true,
    message: "FinSight AI backend is running",
    uptime: Math.floor(process.uptime()),
    database: {
      status: dbStatus,
      connected: readyState === 1,
    },
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
