const express = require("express");
const { protect } = require("../middleware/auth.middleware");
const {
  getBudgets,
  upsertBudget,
  deleteBudget,
} = require("../controllers/budgetController");

const router = express.Router();

router.use(protect);

router.get("/", getBudgets);
router.post("/", upsertBudget);
router.delete("/:id", deleteBudget);

module.exports = router;
