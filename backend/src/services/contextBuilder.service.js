const Transaction = require("../models/Transaction");
const { computeUserSpendingFeatures } = require("./ml.service");

// Prompt injection detection patterns
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior)\s+instructions/i,
  /system\s*prompt/i,
  /you\s+are\s+now\s+a/i,
  /reveal\s+(api\s+)?key/i,
  /drop\s+table/i,
  /--\s*$/m,
];

function sanitizePrompt(prompt = "") {
  let cleaned = String(prompt || "").trim();

  // Guardrail 1: Enforce maximum input length
  if (cleaned.length > 500) {
    cleaned = cleaned.slice(0, 500);
  }

  // Guardrail 2: Flag and neutralize prompt injection attempts
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(cleaned)) {
      return {
        isSafe: false,
        sanitized: "Can you provide a general overview of my finances?",
        warning: "Malicious prompt pattern detected. Query sanitized to standard financial overview.",
      };
    }
  }

  return { isSafe: true, sanitized: cleaned };
}

function calculateHealthScore(totalIncome, totalExpenses) {
  if (totalIncome <= 0) {
    return { score: null, label: "Not enough data" };
  }

  const netSavings = totalIncome - totalExpenses;
  const savingsRate = (netSavings / totalIncome) * 100;
  const expenseRatio = (totalExpenses / totalIncome) * 100;

  let savingsPoints = 0;
  if (savingsRate >= 30) savingsPoints = 60;
  else if (savingsRate >= 20) savingsPoints = 50;
  else if (savingsRate >= 10) savingsPoints = 40;
  else if (savingsRate > 0) savingsPoints = 25;
  else if (savingsRate === 0) savingsPoints = 15;
  else savingsPoints = 0;

  let expensePoints = 0;
  if (expenseRatio <= 50) expensePoints = 40;
  else if (expenseRatio <= 70) expensePoints = 30;
  else if (expenseRatio <= 85) expensePoints = 20;
  else if (expenseRatio <= 100) expensePoints = 10;
  else expensePoints = 0;

  const score = Math.max(0, Math.min(100, savingsPoints + expensePoints));
  let label = "At risk";
  if (score >= 80) label = "Strong";
  else if (score >= 65) label = "Good";
  else if (score >= 50) label = "Fair";
  else if (score >= 35) label = "Needs attention";

  return {
    score,
    label,
    savingsPoints,
    expensePoints,
    savingsRate: Number(savingsRate.toFixed(2)),
    expenseRatio: Number(expenseRatio.toFixed(2)),
  };
}

async function buildGroundedContext(userId, user) {
  const transactions = await Transaction.find({ userId })
    .sort({ date: -1 })
    .lean();

  if (!transactions || transactions.length === 0) {
    return {
      hasData: false,
      userName: user?.name || "User",
      totalTransactions: 0,
      summary: null,
      health: null,
      topCategories: [],
      features: null,
    };
  }

  let totalIncome = 0;
  let totalExpenses = 0;
  const categoryTotals = {};

  for (const tx of transactions) {
    const amt = Number(tx.amount) || 0;
    if (amt <= 0) continue;

    if (tx.type === "income") {
      totalIncome += amt;
    } else if (tx.type === "expense") {
      totalExpenses += amt;
      const cat = tx.category || "Uncategorized";
      categoryTotals[cat] = (categoryTotals[cat] || 0) + amt;
    }
  }

  const netSavings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

  const topCategories = Object.entries(categoryTotals)
    .map(([category, amount]) => ({
      category,
      amount: Math.round(amount),
      percentage: totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  const health = calculateHealthScore(totalIncome, totalExpenses);
  const features = computeUserSpendingFeatures(transactions);

  return {
    hasData: true,
    userName: user?.name || "User",
    totalTransactions: transactions.length,
    summary: {
      totalIncome: Math.round(totalIncome),
      totalExpenses: Math.round(totalExpenses),
      netSavings: Math.round(netSavings),
      savingsRate: Number(savingsRate.toFixed(1)),
    },
    health,
    topCategories: topCategories.slice(0, 5),
    features,
  };
}

module.exports = {
  sanitizePrompt,
  calculateHealthScore,
  buildGroundedContext,
};
