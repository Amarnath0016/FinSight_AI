
const mongoose = require("mongoose");
const Transaction = require("../models/Transaction");

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

// GET /api/transactions
async function getTransactions(req, res) {
  try {
    const transactions = await Transaction.find().sort({
      date: -1,
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions,
    });
  } catch (error) {
    console.error("Fetch transactions failed:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch transactions",
    });
  }
}

// POST /api/transactions
async function addTransaction(req, res) {
  try {
    if (!validateTransaction(req.body)) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid transaction details",
      });
    }

    const transaction = await Transaction.create(
      buildTransactionData(req.body)
    );

    return res.status(201).json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    console.error("Create transaction failed:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to create transaction",
    });
  }
}

// PUT /api/transactions/:id
async function updateTransaction(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid transaction ID",
      });
    }

    if (!validateTransaction(req.body)) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid transaction details",
      });
    }

    const transaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      buildTransactionData(req.body),
      {
        new: true,
        runValidators: true,
      }
    );

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    console.error("Update transaction failed:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to update transaction",
    });
  }
}

// DELETE /api/transactions/:id
async function deleteTransaction(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid transaction ID",
      });
    }

    const transaction = await Transaction.findByIdAndDelete(
      req.params.id
    );

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Transaction deleted successfully",
      data: transaction,
    });
  } catch (error) {
    console.error("Delete transaction failed:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to delete transaction",
    });
  }
}

module.exports = {
  getTransactions,
  addTransaction,
  updateTransaction,
  deleteTransaction,
};
