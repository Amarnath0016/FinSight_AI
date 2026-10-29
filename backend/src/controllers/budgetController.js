const mongoose = require("mongoose");
const Budget = require("../models/Budget");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

// GET /api/budgets
const getBudgets = asyncHandler(async (req, res) => {
  const budgets = await Budget.find({ userId: req.user.id || req.user._id }).sort({ category: 1 }).lean();
  res.status(200).json({
    success: true,
    count: budgets.length,
    budgets,
  });
});

// POST /api/budgets (Upsert budget for category)
const upsertBudget = asyncHandler(async (req, res) => {
  const { category, monthlyLimit } = req.body;

  if (!category || !String(category).trim()) {
    throw new ApiError(400, "Category name is required");
  }

  const limitNum = Number(monthlyLimit);
  if (isNaN(limitNum) || limitNum <= 0) {
    throw new ApiError(400, "Monthly budget limit must be a positive number");
  }

  const cleanCategory = String(category).trim();
  const userId = req.user.id || req.user._id;

  const budget = await Budget.findOneAndUpdate(
    { userId, category: cleanCategory },
    { monthlyLimit: limitNum },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
  );

  res.status(200).json({
    success: true,
    message: "Budget configured successfully",
    budget,
  });
});

// DELETE /api/budgets/:id
const deleteBudget = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid budget ID format");
  }

  const userId = req.user.id || req.user._id;
  const budget = await Budget.findOneAndDelete({ _id: id, userId });

  if (!budget) {
    throw new ApiError(404, "Budget not found or unauthorized");
  }

  res.status(200).json({
    success: true,
    message: "Budget removed successfully",
    id,
  });
});

module.exports = {
  getBudgets,
  upsertBudget,
  deleteBudget,
};
