const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth.middleware");
const {
  getSavedScenarios,
  saveScenario,
  deleteScenario,
} = require("../controllers/simulationController");

// GET /api/scenarios - Fetch user's saved scenarios
router.get("/", protect, getSavedScenarios);

// POST /api/scenarios - Save a scenario
router.post("/", protect, saveScenario);

// DELETE /api/scenarios/:id - Delete a saved scenario
router.delete("/:id", protect, deleteScenario);

module.exports = router;
