const mongoose = require("mongoose");
const Scenario = require("../models/Scenario");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { simulateUserTransactions } = require("../services/simulation.service");

/**
 * Run a what-if simulation calculation on user's real transactions without modifying data.
 * POST /api/simulate
 */
const runSimulation = asyncHandler(async (req, res) => {
  const result = await simulateUserTransactions(req.user._id, req.body || {});

  res.status(200).json({
    success: true,
    ...result,
  });
});

/**
 * Get all saved scenarios for the authenticated user.
 * GET /api/scenarios
 */
const getSavedScenarios = asyncHandler(async (req, res) => {
  const scenarios = await Scenario.find({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({
    success: true,
    count: scenarios.length,
    scenarios,
  });
});

/**
 * Save a simulated scenario for future reference.
 * POST /api/scenarios
 */
const saveScenario = asyncHandler(async (req, res) => {
  const { name, description = "", adjustments = {}, simulatedOutcome = {} } = req.body;

  if (!name || !String(name).trim()) {
    throw new ApiError(400, "Scenario name is required");
  }

  const scenario = await Scenario.create({
    userId: req.user._id,
    name: String(name).trim(),
    description: String(description || "").trim(),
    adjustments,
    simulatedOutcome,
  });

  res.status(201).json({
    success: true,
    message: "Scenario saved successfully",
    scenario,
  });
});

/**
 * Delete a saved scenario (strictly scoped to user).
 * DELETE /api/scenarios/:id
 */
const deleteScenario = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid scenario ID format");
  }

  const scenario = await Scenario.findOneAndDelete({
    _id: id,
    userId: req.user._id,
  });

  if (!scenario) {
    throw new ApiError(404, "Scenario not found or unauthorized");
  }

  res.status(200).json({
    success: true,
    message: "Scenario deleted successfully",
    id,
  });
});

module.exports = {
  runSimulation,
  getSavedScenarios,
  saveScenario,
  deleteScenario,
};
