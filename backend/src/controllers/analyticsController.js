const Transaction = require("../models/Transaction");
const asyncHandler = require("../utils/asyncHandler");
const {
  computeUserSpendingFeatures,
  requestMlSegmentation,
} = require("../services/ml.service");
const { getUserSubscriptions } = require("../services/subscription.service");
const { getUserBudgetPacing } = require("../services/budget.service");

// GET /api/analytics/segmentation
const getUserSegmentation = asyncHandler(async (req, res) => {
  const transactions = await Transaction.find({ userId: req.user.id }).lean();

  if (!transactions || transactions.length === 0) {
    return res.status(200).json({
      success: true,
      hasData: false,
      message: "Please record or import transactions to generate your ML spending segment.",
    });
  }

  const features = computeUserSpendingFeatures(transactions);
  const segmentation = await requestMlSegmentation(features);

  return res.status(200).json({
    success: true,
    hasData: true,
    features,
    segmentation,
  });
});

// GET /api/analytics/subscriptions
const getSubscriptions = asyncHandler(async (req, res) => {
  const result = await getUserSubscriptions(req.user.id);
  res.status(200).json({
    success: true,
    ...result,
  });
});

// GET /api/analytics/budget-pacing
const getBudgetPacing = asyncHandler(async (req, res) => {
  const result = await getUserBudgetPacing(req.user.id);
  res.status(200).json({
    success: true,
    ...result,
  });
});

module.exports = {
  getUserSegmentation,
  getSubscriptions,
  getBudgetPacing,
};
