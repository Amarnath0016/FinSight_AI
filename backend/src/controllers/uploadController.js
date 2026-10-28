const Transaction = require("../models/Transaction");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { parseAndValidateCsv } = require("../services/csv.service");
const { validateTransaction } = require("./transactionController");

// POST /api/upload/preview
const previewCsv = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw ApiError.badRequest("Please select and upload a CSV file.");
  }

  const csvContent = req.file.buffer.toString("utf-8");
  if (!csvContent.trim()) {
    throw ApiError.badRequest("The uploaded CSV file is empty.");
  }

  const result = parseAndValidateCsv(csvContent);

  // Optional: check against existing transactions in DB for duplicates
  const existingTransactions = await Transaction.find({
    userId: req.user.id,
  }).select("date amount type title category");

  const existingSignatures = new Set(
    existingTransactions.map(
      (tx) =>
        `${tx.date}|${tx.amount}|${tx.type}|${tx.title.toLowerCase()}|${tx.category.toLowerCase()}`
    )
  );

  const flaggedValid = result.validTransactions.map((tx) => {
    const signature = `${tx.date}|${tx.amount}|${tx.type}|${tx.title.toLowerCase()}|${tx.category.toLowerCase()}`;
    return {
      ...tx,
      isExistingDuplicate: existingSignatures.has(signature),
    };
  });

  return res.status(200).json({
    success: true,
    filename: req.file.originalname,
    summary: {
      totalRows: result.totalRows,
      validCount: result.validTransactions.length,
      invalidCount: result.invalidRows.length,
      duplicateCount: result.duplicateCount,
      existingDuplicatesCount: flaggedValid.filter((tx) => tx.isExistingDuplicate).length,
    },
    validTransactions: flaggedValid,
    invalidRows: result.invalidRows,
  });
});

// POST /api/upload/commit
const commitCsv = asyncHandler(async (req, res) => {
  const { transactions } = req.body;

  if (!Array.isArray(transactions) || transactions.length === 0) {
    throw ApiError.badRequest("No valid transactions provided for import.");
  }

  // Validate each transaction before persisting
  const prepared = [];
  for (const item of transactions) {
    if (!validateTransaction(item)) {
      throw ApiError.badRequest(
        `Invalid transaction data encountered: ${item.title || "Untitled"}`
      );
    }
    prepared.push({
      title: item.title.trim(),
      amount: Number(item.amount),
      type: item.type,
      category: item.category.trim(),
      date: item.date,
      userId: req.user.id,
    });
  }

  const inserted = await Transaction.insertMany(prepared, { ordered: false });

  return res.status(201).json({
    success: true,
    message: `Successfully imported ${inserted.length} transactions.`,
    insertedCount: inserted.length,
  });
});

module.exports = {
  previewCsv,
  commitCsv,
};
