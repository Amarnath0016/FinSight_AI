const mongoose = require("mongoose");
const Transaction = require("../models/Transaction");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

function validateTransaction(body = {}) {
  const { title, amount, type, category, date } = body;

  const validDate =
    typeof date === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    Number.isFinite(Date.parse(date)) &&
    new Date(date).toISOString().slice(0, 10) === date;

  return (
    typeof title === "string" &&
    title.trim().length > 0 &&
    title.trim().length <= 150 &&
    amount !== "" &&
    amount !== null &&
    amount !== undefined &&
    Number.isFinite(Number(amount)) &&
    Number(amount) > 0 &&
    Number(amount) <= 1_000_000_000_000 &&
    ["income", "expense"].includes(type) &&
    typeof category === "string" &&
    category.trim().length > 0 &&
    category.trim().length <= 100 &&
    validDate
  );
}

function buildTransactionData(body) {
  return {
    title: body.title.trim(),
    amount: Number(body.amount),
    type: body.type,
    category: body.category.trim(),
    date: body.date,
  };
}

// GET /api/transactions (User-scoped)
const getTransactions = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const transactions = await Transaction.find({ userId }).sort({
    date: -1,
    createdAt: -1,
  });

  return res.status(200).json({
    success: true,
    count: transactions.length,
    data: transactions,
  });
});

// POST /api/transactions (Associated with authenticated user)
const addTransaction = asyncHandler(async (req, res) => {
  if (!validateTransaction(req.body)) {
    throw ApiError.badRequest("Please provide valid transaction details");
  }

  const transactionData = {
    ...buildTransactionData(req.body),
    userId: req.user.id,
  };

  const transaction = await Transaction.create(transactionData);

  return res.status(201).json({
    success: true,
    data: transaction,
  });
});

// PUT /api/transactions/:id (Owner-only update, IDOR protected)
const updateTransaction = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    throw ApiError.badRequest("Invalid transaction ID");
  }

  if (!validateTransaction(req.body)) {
    throw ApiError.badRequest("Please provide valid transaction details");
  }

  const transaction = await Transaction.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.id },
    buildTransactionData(req.body),
    {
      new: true,
      runValidators: true,
    }
  );

  if (!transaction) {
    throw ApiError.notFound("Transaction not found");
  }

  return res.status(200).json({
    success: true,
    data: transaction,
  });
});

// DELETE /api/transactions/:id (Owner-only delete, IDOR protected)
const deleteTransaction = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    throw ApiError.badRequest("Invalid transaction ID");
  }

  const transaction = await Transaction.findOneAndDelete({
    _id: req.params.id,
    userId: req.user.id,
  });

  if (!transaction) {
    throw ApiError.notFound("Transaction not found");
  }

  return res.status(200).json({
    success: true,
    message: "Transaction deleted successfully",
    data: transaction,
  });
});

module.exports = {
  validateTransaction,
  buildTransactionData,
  getTransactions,
  addTransaction,
  updateTransaction,
  deleteTransaction,
};
