const express = require("express");
const {
  chatWithCopilot,
  getConversationHistory,
  clearConversationHistory,
} = require("../controllers/copilotController");
const { protect } = require("../middleware/auth.middleware");

const router = express.Router();

// Enforce authentication on all Copilot routes
router.use(protect);

router.post("/chat", chatWithCopilot);
router.get("/history", getConversationHistory);
router.delete("/history", clearConversationHistory);

module.exports = router;
