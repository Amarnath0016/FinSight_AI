
function isValidDateString(value) {
  if (!value) return true;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);

  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}

export function filterTransactions(transactions = [], filters = {}) {
  const {
    search = "",
    type = "all",
    category = "all",
    startDate = "",
    endDate = "",
  } = filters;

  const validDates =
    isValidDateString(startDate) &&
    isValidDateString(endDate);

  const invalidRange =
    startDate && endDate && startDate > endDate;

  if (!validDates || invalidRange) {
    return [];
  }

  const normalizedSearch = search.trim().toLowerCase();

  return transactions.filter((transaction) => {
    const title = String(transaction.title || "").toLowerCase();
    const transactionCategory = String(
      transaction.category || ""
    );

    const matchesSearch = title.includes(normalizedSearch);

    const matchesType =
      type === "all" || transaction.type === type;

    const matchesCategory =
      category === "all" ||
      transactionCategory.toLowerCase() === category.toLowerCase();

    const date = String(transaction.date || "");

    const matchesStartDate =
      !startDate || date >= startDate;

    const matchesEndDate =
      !endDate || date <= endDate;

    return (
      matchesSearch &&
      matchesType &&
      matchesCategory &&
      matchesStartDate &&
      matchesEndDate
    );
  });
}

export function calculateFinancialSummary(transactions = []) {
  const totals = transactions.reduce(
    (result, transaction) => {
      const amount = Number(transaction.amount);

      if (!Number.isFinite(amount) || amount < 0) {
        return result;
      }

      if (transaction.type === "income") {
        result.totalIncome += amount;
      } else if (transaction.type === "expense") {
        result.totalExpenses += amount;
      }

      return result;
    },
    {
      totalIncome: 0,
      totalExpenses: 0,
    }
  );

  const netSavings = totals.totalIncome - totals.totalExpenses;

  const savingsRate =
    totals.totalIncome > 0
      ? (netSavings / totals.totalIncome) * 100
      : 0;

  return {
    ...totals,
    netSavings,
    savingsRate,
  };
}

export function getCategoryExpenseBreakdown(transactions = []) {
  const categoryTotals = new Map();

  for (const transaction of transactions) {
    if (transaction.type !== "expense") continue;

    const amount = Number(transaction.amount);

    if (!Number.isFinite(amount) || amount <= 0) continue;

    const displayCategory =
      String(transaction.category || "").trim() || "Uncategorized";

    const key = displayCategory.toLowerCase();

    const existing = categoryTotals.get(key);

    if (existing) {
      existing.amount += amount;
    } else {
      categoryTotals.set(key, {
        category: displayCategory,
        amount,
      });
    }
  }

  const totalExpenses = Array.from(categoryTotals.values()).reduce(
    (sum, item) => sum + item.amount,
    0
  );

  return Array.from(categoryTotals.values())
    .map((item) => ({
      ...item,
      percentage:
        totalExpenses > 0
          ? (item.amount / totalExpenses) * 100
          : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
}

export function getUniqueCategories(transactions = []) {
  return [
    ...new Set(
      transactions
        .map((transaction) => String(transaction.category || "").trim())
        .filter(Boolean)
    ),
  ].sort((a, b) => a.localeCompare(b));
}
