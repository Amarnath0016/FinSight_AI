const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://127.0.0.1:8000";

const DISCRETIONARY_CATEGORIES = new Set([
  "entertainment",
  "shopping",
  "travel",
  "food",
  "dining",
  "hobbies",
  "gifts",
]);

function computeUserSpendingFeatures(transactions = []) {
  let totalIncome = 0;
  let totalExpense = 0;
  let discretionaryExpense = 0;
  const activeMonths = new Set();

  for (const tx of transactions) {
    const amount = Number(tx.amount) || 0;
    if (amount <= 0) continue;

    if (tx.date && typeof tx.date === "string" && tx.date.length >= 7) {
      activeMonths.add(tx.date.slice(0, 7)); // e.g. "2026-10"
    }

    if (tx.type === "income") {
      totalIncome += amount;
    } else if (tx.type === "expense") {
      totalExpense += amount;
      const cat = String(tx.category || "").trim().toLowerCase();
      if (DISCRETIONARY_CATEGORIES.has(cat)) {
        discretionaryExpense += amount;
      }
    }
  }

  const monthsCount = Math.max(1, activeMonths.size);
  const monthlyIncome = totalIncome / monthsCount;
  const monthlyExpense = totalExpense / monthsCount;

  const savingsRate =
    totalIncome > 0
      ? ((totalIncome - totalExpense) / totalIncome) * 100
      : 0;

  const expenseRatio =
    totalIncome > 0
      ? (totalExpense / totalIncome) * 100
      : 100;

  const discretionaryRatio =
    totalExpense > 0
      ? discretionaryExpense / totalExpense
      : 0.3;

  return {
    monthly_income: Math.round(monthlyIncome * 100) / 100,
    monthly_expense: Math.round(monthlyExpense * 100) / 100,
    savings_rate: Math.round(savingsRate * 100) / 100,
    expense_ratio: Math.round(expenseRatio * 100) / 100,
    discretionary_ratio: Math.round(discretionaryRatio * 100) / 100,
    months_analyzed: monthsCount,
    total_transactions: transactions.length,
  };
}

async function requestMlSegmentation(features) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3500);

  try {
    const response = await fetch(`${ML_SERVICE_URL}/segmentation/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        monthly_income: features.monthly_income,
        monthly_expense: features.monthly_expense,
        savings_rate: features.savings_rate,
        expense_ratio: features.expense_ratio,
        discretionary_ratio: features.discretionary_ratio,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`ML service returned HTTP ${response.status}`);
    }

    const data = await response.json();
    return {
      available: true,
      source: "python-kmeans",
      ...data,
    };
  } catch (error) {
    clearTimeout(timeoutId);

    // Resilient fallback heuristic if Python ML service is offline
    const isSaver = features.savings_rate >= 30;
    const isHighOutflow = features.savings_rate < 10 || features.expense_ratio > 90;

    let clusterName = "Balanced Spender";
    let desc = "Stable financial rhythm with moderate savings and managed daily living expenses.";
    let rec = "Healthy baseline. Look for opportunities to trim recurring subscriptions and automate a 5% increase to your monthly savings.";

    if (isSaver) {
      clusterName = "Disciplined Saver";
      desc = "Consistent high surplus, strong savings allocation, and disciplined discretionary spending.";
      rec = "Great financial resilience! Consider exploring tax-advantaged investments, emergency liquid reserves, and medium-term growth assets.";
    } else if (isHighOutflow) {
      clusterName = "High-Outflow Spender";
      desc = "Expenses consume nearly all (or more than) total income, leaving minimal reserve for unexpected events.";
      rec = "High priority: conduct a category audit to identify non-essential discretionary costs and build a baseline emergency buffer.";
    }

    return {
      available: false,
      source: "heuristic-fallback",
      warning: "Python ML microservice offline. Serving heuristic baseline estimation.",
      cluster_name: clusterName,
      description: desc,
      recommendation: rec,
      profile_summary: features,
      model_version: "heuristic-fallback-v1.0",
    };
  }
}

module.exports = {
  computeUserSpendingFeatures,
  requestMlSegmentation,
};
