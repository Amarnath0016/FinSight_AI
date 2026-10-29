const Transaction = require("../models/Transaction");
const { calculateHealthScore } = require("./contextBuilder.service");

/**
 * Calculates monthly baseline metrics from a user's transaction records.
 * Pure function: Does not mutate inputs or database records.
 *
 * @param {Array} transactions - Array of transaction objects
 * @returns {Object} Baseline financial metrics
 */
function calculateBaselineMetrics(transactions = []) {
  if (!Array.isArray(transactions) || transactions.length === 0) {
    return {
      hasData: false,
      monthCount: 1,
      totalIncome: 0,
      totalExpenses: 0,
      totalSavings: 0,
      monthlyIncome: 0,
      monthlyExpenses: 0,
      monthlySavings: 0,
      savingsRate: 0,
      categories: [],
      categoryMap: {},
      health: { score: null, label: "Not enough data" },
    };
  }

  let totalIncome = 0;
  let totalExpenses = 0;
  const categoryMap = {};
  let earliestDate = null;
  let latestDate = null;

  for (const tx of transactions) {
    const amt = Number(tx.amount) || 0;
    if (amt <= 0) continue;

    // Track dates to estimate historical time span
    if (tx.date) {
      const d = new Date(tx.date);
      if (!isNaN(d.getTime())) {
        if (!earliestDate || d < earliestDate) earliestDate = d;
        if (!latestDate || d > latestDate) latestDate = d;
      }
    }

    if (tx.type === "income") {
      totalIncome += amt;
    } else if (tx.type === "expense") {
      totalExpenses += amt;
      const cat = tx.category ? String(tx.category).trim() : "Uncategorized";
      categoryMap[cat] = (categoryMap[cat] || 0) + amt;
    }
  }

  // Estimate number of months spanned by data (minimum 1 month)
  let monthCount = 1;
  if (earliestDate && latestDate) {
    const diffMs = latestDate.getTime() - earliestDate.getTime();
    const diffDays = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));
    if (diffDays >= 20) {
      monthCount = Math.max(1, Math.round(diffDays / 30.4375));
    }
  }

  const totalSavings = totalIncome - totalExpenses;
  const monthlyIncome = Math.round(totalIncome / monthCount);
  const monthlyExpenses = Math.round(totalExpenses / monthCount);
  const monthlySavings = monthlyIncome - monthlyExpenses;
  const savingsRate =
    monthlyIncome > 0
      ? Number(((monthlySavings / monthlyIncome) * 100).toFixed(1))
      : 0;

  const categories = Object.entries(categoryMap)
    .map(([category, totalAmount]) => {
      const monthlyAmount = Math.round(totalAmount / monthCount);
      const percentage =
        totalExpenses > 0 ? Math.round((totalAmount / totalExpenses) * 100) : 0;
      return {
        category,
        totalAmount: Math.round(totalAmount),
        monthlyAmount,
        percentage,
      };
    })
    .sort((a, b) => b.monthlyAmount - a.monthlyAmount);

  // Health score for the normalized monthly cash flow
  const health = calculateHealthScore(monthlyIncome, monthlyExpenses);

  return {
    hasData: true,
    monthCount,
    totalIncome: Math.round(totalIncome),
    totalExpenses: Math.round(totalExpenses),
    totalSavings: Math.round(totalSavings),
    monthlyIncome,
    monthlyExpenses,
    monthlySavings,
    savingsRate,
    categories,
    categoryMap,
    health,
  };
}

/**
 * Computes what-if simulation deltas based on baseline metrics and hypothetical user adjustments.
 * Pure mathematical projection: Zero modifications to database or baseline.
 *
 * @param {Object} baseline - Output of calculateBaselineMetrics
 * @param {Object} adjustments - Hypothetical scenario inputs
 * @returns {Object} Comprehensive baseline vs simulated comparison
 */
function computeScenarioSimulation(baseline, adjustments = {}) {
  const {
    monthlyIncomeDelta = 0,
    incomePercentChange = 0,
    categoryAdjustments = {},
    additionalMonthlyExpense = 0,
    targetGoal = null,
  } = adjustments;

  const incomeDeltaNum = Number(monthlyIncomeDelta) || 0;
  const incomePctNum = Number(incomePercentChange) || 0;
  const addlExpenseNum = Math.max(0, Number(additionalMonthlyExpense) || 0);

  // 1. Calculate Simulated Monthly Income
  const baselineMonthlyIncome = baseline.monthlyIncome || 0;
  const incomeFromPct = baselineMonthlyIncome * (1 + incomePctNum / 100);
  const simulatedMonthlyIncome = Math.max(
    0,
    Math.round(incomeFromPct + incomeDeltaNum)
  );

  // 2. Calculate Simulated Category Spending
  const categoryComparison = (baseline.categories || []).map((cat) => {
    const rawAdjustment = categoryAdjustments[cat.category];
    // Adjustment can be negative (reduction like -20%) or positive (increase like +10%)
    const pctChange =
      rawAdjustment !== undefined && rawAdjustment !== null
        ? Number(rawAdjustment)
        : 0;

    // Spending cannot be reduced below 0 (-100% max cut)
    const effectivePct = Math.max(-100, pctChange);
    const simulatedAmount = Math.max(
      0,
      Math.round(cat.monthlyAmount * (1 + effectivePct / 100))
    );
    const deltaAmount = simulatedAmount - cat.monthlyAmount;

    return {
      category: cat.category,
      baselineAmount: cat.monthlyAmount,
      simulatedAmount,
      deltaAmount,
      percentChange: effectivePct,
    };
  });

  // Calculate sum of simulated categories
  const simulatedCategoryTotal = categoryComparison.reduce(
    (sum, c) => sum + c.simulatedAmount,
    0
  );

  // Simulated total expenses includes adjusted categories plus any new fixed expenses (EMI, rent, loans)
  const simulatedMonthlyExpenses = simulatedCategoryTotal + Math.round(addlExpenseNum);

  // 3. Calculate Simulated Net Savings and Savings Rate
  const simulatedMonthlySavings =
    simulatedMonthlyIncome - simulatedMonthlyExpenses;
  const simulatedSavingsRate =
    simulatedMonthlyIncome > 0
      ? Number(
          (
            (simulatedMonthlySavings / simulatedMonthlyIncome) *
            100
          ).toFixed(1)
        )
      : 0;

  // 4. Calculate Simulated Health Score
  const simulatedHealth = calculateHealthScore(
    simulatedMonthlyIncome,
    simulatedMonthlyExpenses
  );

  // 5. Calculate Deltas
  const baselineMonthlyExpenses = baseline.monthlyExpenses || 0;
  const baselineMonthlySavings = baseline.monthlySavings || 0;
  const baselineSavingsRate = baseline.savingsRate || 0;
  const baselineScore = baseline.health?.score ?? null;
  const simScore = simulatedHealth.score ?? null;

  const deltaIncome = simulatedMonthlyIncome - baselineMonthlyIncome;
  const deltaExpenses = simulatedMonthlyExpenses - baselineMonthlyExpenses;
  const deltaSavings = simulatedMonthlySavings - baselineMonthlySavings;
  const deltaSavingsRate = Number(
    (simulatedSavingsRate - baselineSavingsRate).toFixed(1)
  );
  const deltaScore =
    baselineScore !== null && simScore !== null ? simScore - baselineScore : null;

  const annualBaselineSavings = baselineMonthlySavings * 12;
  const annualSimulatedSavings = simulatedMonthlySavings * 12;
  const annualSavingsDelta = deltaSavings * 12;

  // 6. Target Goal Feasibility Analysis
  let goalFeasibility = null;
  const goalTargetAmount = Number(targetGoal?.targetAmount) || 0;
  if (goalTargetAmount > 0) {
    const goalName = targetGoal?.name ? String(targetGoal.name).trim() : "Target Goal";

    const monthsToGoalBase =
      baselineMonthlySavings > 0
        ? Math.ceil(goalTargetAmount / baselineMonthlySavings)
        : null;

    const monthsToGoalSim =
      simulatedMonthlySavings > 0
        ? Math.ceil(goalTargetAmount / simulatedMonthlySavings)
        : null;

    const monthsSaved =
      monthsToGoalBase !== null && monthsToGoalSim !== null
        ? monthsToGoalBase - monthsToGoalSim
        : null;

    goalFeasibility = {
      name: goalName,
      targetAmount: goalTargetAmount,
      monthsToGoalBase,
      monthsToGoalSim,
      monthsSaved,
      isReachableSimulated: monthsToGoalSim !== null,
    };
  }

  // 7. Prescriptive Scenario Insights
  const insights = [];

  // Monthly and Annual Savings impact
  if (deltaSavings > 0) {
    insights.push({
      type: "positive",
      text: `Your scenario frees up an additional ₹${deltaSavings.toLocaleString(
        "en-IN"
      )} per month, generating a projected annual surplus of +₹${annualSavingsDelta.toLocaleString(
        "en-IN"
      )}.`,
    });
  } else if (deltaSavings < 0) {
    insights.push({
      type: "warning",
      text: `This scenario reduces your monthly net cash flow by ₹${Math.abs(
        deltaSavings
      ).toLocaleString("en-IN")}, decreasing your yearly savings cushion by ₹${Math.abs(
        annualSavingsDelta
      ).toLocaleString("en-IN")}.`,
    });
  } else {
    insights.push({
      type: "neutral",
      text: "Net monthly cash flow remains unchanged under this configuration.",
    });
  }

  // Health Score change
  if (deltaScore !== null) {
    if (deltaScore > 0) {
      insights.push({
        type: "positive",
        text: `Your Financial Health Score improves by +${deltaScore} points, moving from ${baseline.health?.label} (${baselineScore}) to ${simulatedHealth.label} (${simScore}).`,
      });
    } else if (deltaScore < 0) {
      insights.push({
        type: "warning",
        text: `Your Financial Health Score decreases by ${Math.abs(
          deltaScore
        )} points (${baselineScore} → ${simScore}), reflecting higher expense obligations.`,
      });
    }
  }

  // Category expense cuts highlights
  const reducedCategories = categoryComparison.filter((c) => c.deltaAmount < 0);
  if (reducedCategories.length > 0) {
    const bestCut = [...reducedCategories].sort(
      (a, b) => a.deltaAmount - b.deltaAmount
    )[0];
    insights.push({
      type: "info",
      text: `Your largest spending reduction is in "${
        bestCut.category
      }" (${bestCut.percentChange}%), saving ₹${Math.abs(
        bestCut.deltaAmount
      ).toLocaleString("en-IN")}/month.`,
    });
  }

  // Goal timeline insight
  if (goalFeasibility) {
    if (goalFeasibility.monthsSaved !== null && goalFeasibility.monthsSaved > 0) {
      insights.push({
        type: "positive",
        text: `You will reach your "${goalFeasibility.name}" goal in ${goalFeasibility.monthsToGoalSim} months instead of ${goalFeasibility.monthsToGoalBase} months (${goalFeasibility.monthsSaved} months faster!).`,
      });
    } else if (
      goalFeasibility.monthsToGoalBase === null &&
      goalFeasibility.monthsToGoalSim !== null
    ) {
      insights.push({
        type: "positive",
        text: `Your "${goalFeasibility.name}" goal becomes achievable in ${goalFeasibility.monthsToGoalSim} months (previously unreachable due to zero or negative surplus).`,
      });
    } else if (
      goalFeasibility.monthsSaved !== null &&
      goalFeasibility.monthsSaved < 0
    ) {
      insights.push({
        type: "warning",
        text: `Reaching your "${goalFeasibility.name}" goal will take ${Math.abs(
          goalFeasibility.monthsSaved
        )} months longer due to reduced monthly surplus.`,
      });
    }
  }

  // Deficit warning
  if (simulatedMonthlySavings < 0) {
    insights.push({
      type: "danger",
      text: `Warning: Expenses exceed income by ₹${Math.abs(
        simulatedMonthlySavings
      ).toLocaleString("en-IN")}/month under this scenario. Consider lowering new expenses or limiting category increases.`,
    });
  }

  return {
    baseline: {
      monthlyIncome: baselineMonthlyIncome,
      monthlyExpenses: baselineMonthlyExpenses,
      monthlySavings: baselineMonthlySavings,
      savingsRate: baselineSavingsRate,
      annualSavings: annualBaselineSavings,
      health: baseline.health,
    },
    simulated: {
      monthlyIncome: simulatedMonthlyIncome,
      monthlyExpenses: simulatedMonthlyExpenses,
      monthlySavings: simulatedMonthlySavings,
      savingsRate: simulatedSavingsRate,
      annualSavings: annualSimulatedSavings,
      health: simulatedHealth,
    },
    deltas: {
      income: deltaIncome,
      expenses: deltaExpenses,
      savings: deltaSavings,
      savingsRate: deltaSavingsRate,
      score: deltaScore,
      annualSavings: annualSavingsDelta,
    },
    categoryComparison,
    goalFeasibility,
    insights,
    adjustments: {
      monthlyIncomeDelta: incomeDeltaNum,
      incomePercentChange: incomePctNum,
      categoryAdjustments,
      additionalMonthlyExpense: addlExpenseNum,
      targetGoal: targetGoal || null,
    },
  };
}

/**
 * Runs a scenario simulation against the authenticated user's transaction history.
 * Strictly user-scoped and purely in-memory.
 */
async function simulateUserTransactions(userId, adjustments = {}) {
  const transactions = await Transaction.find({ userId })
    .sort({ date: -1 })
    .lean();

  const baseline = calculateBaselineMetrics(transactions);
  return computeScenarioSimulation(baseline, adjustments);
}

module.exports = {
  calculateBaselineMetrics,
  computeScenarioSimulation,
  simulateUserTransactions,
};
