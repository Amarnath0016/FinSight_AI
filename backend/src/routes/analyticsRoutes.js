const express = require("express");
const {
  getUserSegmentation,
  getSubscriptions,
  getBudgetPacing,
} = require("../controllers/analyticsController");
const { protect } = require("../middleware/auth.middleware");

const router = express.Router();

router.use(protect);

router.get("/segmentation", getUserSegmentation);
router.get("/subscriptions", getSubscriptions);
router.get("/budget-pacing", getBudgetPacing);

module.exports = router;
