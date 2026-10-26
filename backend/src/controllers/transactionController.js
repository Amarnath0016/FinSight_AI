
const mongoose = require("mongoose");
const Transaction = require("../models/Transaction");

// Validate transaction fields
function validateTransaction(body) {
  const { title, amount, type, category, date } = body;

  return (
    typeof title === "string" &&
    title.trim().length > 0 &&
    amount !== "" &&
    amount !== null &&
    amount !== undefined &&
    Number.isFinite(Number(amount)) &&
    Number(amount) > 0 &&
    ["income", "expense"].includes(type) &&
    typeof category === "string" &&
    category.trim().length > 0 &&
    typeof date === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    Number.isFinite(Date.parse(date)) &&
    new Date(date).toISOString().slice(0, 10) === date
  );
}

// GET /api/transactions
async function getTransactions(req, res) {
  try {
    const transactions = await Transaction.find().sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions,
    });
  } catch (error) {
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

    const transaction = await Transaction.create({
      ...req.body,
      title: req.body.title.trim(),
      amount: Number(req.body.amount),
      category: req.body.category.trim(),
    });

    return res.status(201).json({
      success: true,
      data: transaction,
    });
  } catch (error) {
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
      {
        ...req.body,
        title: req.body.title.trim(),
        amount: Number(req.body.amount),
        category: req.body.category.trim(),
      },
      { new: true, runValidators: true }
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

