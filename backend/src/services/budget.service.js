const Budget = require("../models/Budget");
const Transaction = require("../models/Transaction");

/**
 * Calculates budget pacing, burn rate, and projected end-of-month status.
 * Pure function: Zero mutations to database or inputs.
 *
 * @param {Array} budgets - Array of budget objects ({ category, monthlyLimit })
 * @param {Array} currentMonthTransactions - Array of expense transactions for the current calendar month
 * @param {Date} asOfDate - Date to evaluate against (defaults to now)
 * @returns {Object} Comprehensive category pacing report
 */
function calculateBudgetPacing(
  budgets = [],
  currentMonthTransactions = [],
  asOfDate = new Date()
) {
  const date = asOfDate instanceof Date && !isNaN(asOfDate.getTime()) ? asOfDate : new Date();
  const currentDay = date.getDate();
  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const monthElapsedPercent = Number(((currentDay / daysInMonth) * 100).toFixed(1));

  // Aggregate current month expense spending by category
  const spentByCategory = {};
  for (const tx of currentMonthTransactions) {
    if (tx && tx.type === "expense" && Number(tx.amount) > 0) {
      const cat = String(tx.category || "Uncategorized").trim();
      spentByCategory[cat] = (spentByCategory[cat] || 0) + Number(tx.amount);
    }
  }

  let totalBudget = 0;
  let totalSpent = 0;

  const categoryReports = (budgets || []).map((b) => {
    const category = b.category;
    const monthlyLimit = Number(b.monthlyLimit) || 0;
    const spent = Math.round(spentByCategory[category] || 0);
    const remaining = Math.max(0, monthlyLimit - spent);
    const percentUsed = monthlyLimit > 0 ? Number(((spent / monthlyLimit) * 100).toFixed(1)) : 0;

    // Daily burn rate & end-of-month projection
    const dailyVelocity = currentDay > 0 ? spent / currentDay : 0;
    const projectedMonthEnd = Math.round(dailyVelocity * daysInMonth);
    const projectedOverspend = projectedMonthEnd - monthlyLimit;

    let status = "on_track";
    let statusLabel = "On Track";

    if (spent > monthlyLimit) {
      status = "exceeded";
      statusLabel = "Over Budget";
    } else if (projectedMonthEnd > monthlyLimit) {
      status = "at_risk";
      statusLabel = "Pacing Fast (At Risk)";
    }

    totalBudget += monthlyLimit;
    totalSpent += spent;

    return {
      id: b._id || category,
      category,
      monthlyLimit,
      spent,
      remaining,
      percentUsed,
      dailyVelocity: Math.round(dailyVelocity),
      projectedMonthEnd,
      projectedOverspend,
      status,
      statusLabel,
    };
  });

  const totalRemaining = Math.max(0, totalBudget - totalSpent);
  const totalPercentUsed = totalBudget > 0 ? Number(((totalSpent / totalBudget) * 100).toFixed(1)) : 0;

  return {
    asOfDay: currentDay,
    daysInMonth,
    daysRemaining: daysInMonth - currentDay,
    monthElapsedPercent,
    totalBudget,
    totalSpent,
    totalRemaining,
    totalPercentUsed,
    categoryBudgets: categoryReports,
  };
}

/**
 * Loads user budgets and current month's transactions to generate real-time pacing.
 */
async function getUserBudgetPacing(userId) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const [budgets, transactions] = await Promise.all([
    Budget.find({ userId }).lean(),
    Transaction.find({
      userId,
      type: "expense",
      date: { $gte: startOfMonth, $lte: endOfMonth },
    }).lean(),
  ]);

  return calculateBudgetPacing(budgets, transactions, now);
}

module.exports = {
  calculateBudgetPacing,
  getUserBudgetPacing,
};
