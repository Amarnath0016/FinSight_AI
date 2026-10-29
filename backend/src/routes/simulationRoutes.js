const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth.middleware");
const { runSimulation } = require("../controllers/simulationController");

// POST /api/simulate - Run what-if financial simulation
router.post("/", protect, runSimulation);

module.exports = router;
