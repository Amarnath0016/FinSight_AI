
const MAX_SAVINGS_POINTS = 60;
const MAX_EXPENSE_POINTS = 40;

function toValidAmount(value) {
  const amount = Number(value);

  return Number.isFinite(amount) && amount >= 0
    ? amount
    : null;
}

function formatINR(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function calculateSavingsPoints(savingsRate) {
  if (savingsRate < 0) return 0;
  if (savingsRate === 0) return 15;
  if (savingsRate < 10) return 25;
  if (savingsRate < 20) return 40;
  if (savingsRate < 30) return 50;

  return MAX_SAVINGS_POINTS;
}

function calculateExpensePoints(expenseRatio) {
  if (expenseRatio <= 50) return MAX_EXPENSE_POINTS;
  if (expenseRatio <= 70) return 30;
  if (expenseRatio <= 85) return 20;
  if (expenseRatio <= 100) return 10;

  return 0;
}

function getScoreLabel(score) {
  if (score >= 80) return "Strong";
  if (score >= 65) return "Good";
  if (score >= 50) return "Fair";
  if (score >= 35) return "Needs attention";

  return "At risk";
}

export function calculateFinancialHealth(transactions = []) {
  const safeTransactions = Array.isArray(transactions)
    ? transactions
    : [];

  const validTransactions = safeTransactions
    .filter((transaction) => {
      return (
        transaction &&
        ["income", "expense"].includes(transaction.type) &&
        toValidAmount(transaction.amount) !== null
      );
    });

  const totalIncome = validTransactions
    .filter((transaction) => transaction.type === "income")
    .reduce(
      (total, transaction) =>
        total + toValidAmount(transaction.amount),
      0
    );

  const totalExpenses = validTransactions
    .filter((transaction) => transaction.type === "expense")
    .reduce(
      (total, transaction) =>
        total + toValidAmount(transaction.amount),
      0
    );

  const netSavings = totalIncome - totalExpenses;

  // Without recorded income, the ratios cannot provide a meaningful score.
  if (totalIncome <= 0) {
    return {
      score: null,
      label: "Not enough data",
      totalIncome,
      totalExpenses,
      netSavings,
      savingsRate: null,
      expenseRatio: null,
      breakdown: [],
      insights: [
        {
          type: "info",
          title: "Record your income",
          message:
            "Add at least one valid income transaction to calculate your initial financial health score.",
        },
        ...(totalExpenses > 0
          ? [
              {
                type: "warning",
                title: "Expenses are recorded",
                message:
                  `${formatINR(totalExpenses)} in expenses are recorded, ` +
                  "but no valid income is available for comparison.",
              },
            ]
          : []),
      ],
      transactionCount: validTransactions.length,
    };
  }

  const savingsRate = (netSavings / totalIncome) * 100;
  const expenseRatio = (totalExpenses / totalIncome) * 100;

  const savingsPoints = calculateSavingsPoints(savingsRate);
  const expensePoints = calculateExpensePoints(expenseRatio);
  const score = Math.max(
    0,
    Math.min(100, savingsPoints + expensePoints)
  );

  const insights = [];

  if (netSavings < 0) {
    insights.push({
      type: "warning",
      title: "Expenses exceed income",
      message:
        `Recorded expenses exceed income by ${formatINR(
          Math.abs(netSavings)
        )}. Review your spending and check that all transactions are accurate.`,
    });
  } else if (netSavings === 0) {
    insights.push({
      type: "warning",
      title: "No net savings recorded",
      message:
        "Recorded income and expenses are equal. Review your budget to see whether any savings are possible.",
    });
  } else if (savingsRate < 10) {
    insights.push({
      type: "info",
      title: "Savings rate is relatively low",
      message:
        `Your recorded savings rate is ${savingsRate.toFixed(
          1
        )}%. Review your budget and consider a realistic savings goal.`,
    });
  } else {
    insights.push({
      type: "positive",
      title: "Positive cash flow",
      message:
        `You have ${formatINR(
          netSavings
        )} in net savings across the recorded transactions.`,
    });
  }

  if (expenseRatio > 80) {
    insights.push({
      type: "warning",
      title: "High expense-to-income ratio",
      message:
        `Recorded expenses use ${expenseRatio.toFixed(
          1
        )}% of your income. Check essential costs and discretionary spending.`,
    });
  } else {
    insights.push({
      type: "positive",
      title: "Expenses are below the high-ratio threshold",
      message:
        `Recorded expenses account for ${expenseRatio.toFixed(
          1
        )}% of income. This ratio does not account for unrecorded costs or debt obligations.`,
    });
  }

  return {
    score,
    label: getScoreLabel(score),
    totalIncome,
    totalExpenses,
    netSavings,
    savingsRate,
    expenseRatio,
    breakdown: [
      {
        key: "savings",
        label: "Savings rate",
        points: savingsPoints,
        maxPoints: MAX_SAVINGS_POINTS,
        value: `${savingsRate.toFixed(1)}%`,
        explanation:
          "Up to 60 points. Higher recorded savings rates earn more points.",
      },
      {
        key: "expenses",
        label: "Expense-to-income ratio",
        points: expensePoints,
        maxPoints: MAX_EXPENSE_POINTS,
        value: `${expenseRatio.toFixed(1)}%`,
        explanation:
          "Up to 40 points. Lower expense-to-income ratios earn more points.",
      },
    ],
    insights,
    transactionCount: validTransactions.length,
  };
}
