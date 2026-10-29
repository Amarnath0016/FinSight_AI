const Transaction = require("../models/Transaction");

/**
 * Normalizes merchant/subscription names from transaction titles
 * e.g., "Netflix Premium Subscription" -> "Netflix"
 */
function normalizeSubscriptionTitle(rawTitle = "") {
  let title = String(rawTitle).trim();

  // Common subscription synonyms, domain extensions, and noise words
  const noise = [
    /\b(subscription|monthly|sub|plan|bill|auto-debit|autopay|membership|fee|recurring)\b/gi,
    /\.(com|in|co|org|io|net)\b/gi,
    /[0-9#*._-]/g,
    /\s+/g,
  ];

  let cleaned = title;
  cleaned = cleaned.replace(noise[0], "");
  cleaned = cleaned.replace(noise[1], "");
  cleaned = cleaned.replace(noise[2], " ");
  cleaned = cleaned.replace(noise[3], " ").trim();

  return cleaned.length > 2 ? cleaned : title;
}

/**
 * Analyzes an array of expense transactions to detect recurring monthly subscriptions and price creep.
 * Pure function: Zero mutations to transaction data.
 *
 * @param {Array} transactions - Array of transaction objects
 * @returns {Object} Detected subscriptions, totals, and prescriptive insights
 */
function detectSubscriptions(transactions = []) {
  if (!Array.isArray(transactions) || transactions.length === 0) {
    return {
      subscriptions: [],
      totalMonthlyCommitment: 0,
      totalAnnualCommitment: 0,
      subscriptionCount: 0,
      insights: [],
    };
  }

  // Filter only valid expense transactions with dates
  const expenses = transactions.filter(
    (tx) => tx && tx.type === "expense" && Number(tx.amount) > 0 && tx.date
  );

  // Group by normalized title
  const groups = {};
  for (const tx of expenses) {
    const rawTitle = tx.title || "Untitled Expense";
    const normKey = normalizeSubscriptionTitle(rawTitle).toLowerCase();

    if (!groups[normKey]) {
      groups[normKey] = {
        displayName: rawTitle,
        category: tx.category || "Subscriptions & Bills",
        transactions: [],
      };
    }
    groups[normKey].transactions.push({
      date: new Date(tx.date),
      amount: Number(tx.amount),
      title: tx.title,
    });
  }

  const detected = [];

  for (const [key, group] of Object.entries(groups)) {
    const txList = group.transactions;
    // Need at least 2 occurrences to establish a recurring pattern
    if (txList.length < 2) continue;

    // Sort chronologically ascending
    txList.sort((a, b) => a.date.getTime() - b.date.getTime());

    // Calculate intervals between occurrences in days
    const intervals = [];
    for (let i = 1; i < txList.length; i++) {
      const diffMs = txList[i].date.getTime() - txList[i - 1].date.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      intervals.push(diffDays);
    }

    const avgInterval =
      intervals.reduce((sum, d) => sum + d, 0) / intervals.length;

    // Standard monthly recurring interval is roughly 20 to 45 days
    const isMonthlyCadence = avgInterval >= 18 && avgInterval <= 45;

    // If matches recurring monthly cadence or repeated 3+ times with consistent pricing
    if (isMonthlyCadence || (txList.length >= 3 && avgInterval <= 65)) {
      const latestTx = txList[txList.length - 1];
      const earliestTx = txList[0];
      const monthlyAmount = latestTx.amount;
      const annualAmount = monthlyAmount * 12;

      // Price Creep Detection (Compare earliest recorded amount vs latest)
      let priceChange = null;
      if (Math.abs(latestTx.amount - earliestTx.amount) > 0) {
        const delta = latestTx.amount - earliestTx.amount;
        const percent = Number(
          ((delta / earliestTx.amount) * 100).toFixed(1)
        );
        priceChange = {
          hasChanged: true,
          previousAmount: earliestTx.amount,
          currentAmount: latestTx.amount,
          delta,
          percent,
          direction: delta > 0 ? "increased" : "decreased",
        };
      }

      // Estimate next billing date (latestDate + 30 days)
      const nextDate = new Date(latestTx.date);
      nextDate.setDate(nextDate.getDate() + 30);

      detected.push({
        id: key,
        name: group.displayName,
        category: group.category,
        monthlyAmount,
        annualAmount,
        occurrences: txList.length,
        averageIntervalDays: Math.round(avgInterval),
        lastChargedDate: latestTx.date.toISOString().split("T")[0],
        nextEstimatedDate: nextDate.toISOString().split("T")[0],
        priceChange,
      });
    }
  }

  // Sort by highest monthly cost first
  detected.sort((a, b) => b.monthlyAmount - a.monthlyAmount);

  const totalMonthlyCommitment = detected.reduce(
    (sum, s) => sum + s.monthlyAmount,
    0
  );
  const totalAnnualCommitment = totalMonthlyCommitment * 12;

  // Generate prescriptive insights
  const insights = [];
  if (detected.length > 0) {
    insights.push({
      type: "info",
      text: `You have ${detected.length} active recurring subscriptions totaling ₹${totalMonthlyCommitment.toLocaleString(
        "en-IN"
      )}/month (₹${totalAnnualCommitment.toLocaleString("en-IN")}/year).`,
    });

    const priceHikes = detected.filter(
      (s) => s.priceChange && s.priceChange.delta > 0
    );
    if (priceHikes.length > 0) {
      priceHikes.forEach((h) => {
        insights.push({
          type: "warning",
          text: `Price Creep Alert: "${h.name}" increased by +₹${h.priceChange.delta.toLocaleString(
            "en-IN"
          )} (${h.priceChange.percent}%) compared to your earliest recorded charge.`,
        });
      });
    }

    if (totalMonthlyCommitment >= 3000) {
      insights.push({
        type: "tip",
        text: `Auditing or cancelling just one underutilized subscription could free up ₹5,000–₹12,000 in annual surplus.`,
      });
    }
  }

  return {
    subscriptions: detected,
    totalMonthlyCommitment,
    totalAnnualCommitment,
    subscriptionCount: detected.length,
    insights,
  };
}

/**
 * Scans user transactions in MongoDB to detect subscriptions.
 * Scoped to authenticated user.
 */
async function getUserSubscriptions(userId) {
  const transactions = await Transaction.find({ userId, type: "expense" })
    .sort({ date: 1 })
    .lean();

  return detectSubscriptions(transactions);
}

module.exports = {
  normalizeSubscriptionTitle,
  detectSubscriptions,
  getUserSubscriptions,
};
