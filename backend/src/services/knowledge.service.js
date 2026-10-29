const KNOWLEDGE_BASE = [
  {
    topic: "50/30/20 Rule",
    keywords: ["50/30/20", "budget rule", "how to budget", "split income", "wants needs"],
    summary:
      "The 50/30/20 rule is a popular budgeting framework: allocate 50% of your net income to Needs (rent, groceries, utilities), 30% to Wants (entertainment, dining out, hobbies), and 20% to Savings or debt repayment.",
    action:
      "Compare your current expense-to-income ratio against this benchmark to see where you might be over-allocating on discretionary items.",
  },
  {
    topic: "Emergency Fund",
    keywords: ["emergency fund", "contingency", "liquid savings", "rainy day", "buffer"],
    summary:
      "An emergency fund is a liquid savings reserve covering 3 to 6 months of essential living expenses (housing, utilities, food, debt minimums). It protects you from high-interest debt when unexpected costs occur.",
    action:
      "Start with a micro-goal of 1 month of living expenses in an easily accessible high-yield savings account or liquid deposit.",
  },
  {
    topic: "Savings Rate Benchmarks",
    keywords: ["savings rate", "how much should i save", "good savings rate", "target savings"],
    summary:
      "A healthy savings rate is generally considered 20% or higher. A rate below 10% indicates vulnerability to unexpected shocks, while 10%–20% is a solid baseline for moderate financial security.",
    action:
      "If your savings rate is under 15%, try setting an automatic transfer on payday to save an extra 3% to 5% of your income before spending.",
  },
  {
    topic: "Debt-to-Income Management",
    keywords: ["debt", "loans", "emi", "credit card", "liabilities"],
    summary:
      "Monthly non-mortgage debt service (credit cards, personal loans, vehicle EMIs) should ideally remain below 15% to 20% of your gross monthly income.",
    action:
      "Prioritize high-interest balances (such as credit card interest) first using either the Avalanche method (highest interest first) or Snowball method (smallest balance first).",
  },
  {
    topic: "Discretionary Spending Leaks",
    keywords: ["discretionary", "shopping", "subscriptions", "eating out", "cut expenses"],
    summary:
      "Discretionary spending refers to non-essential expenses like dining out, streaming subscriptions, and lifestyle shopping. These categories often produce recurring financial leaks without active tracking.",
    action:
      "Audit your recurring subscriptions every quarter and pause services you haven't used in the past 30 days.",
  },
];

function retrieveRelevantKnowledge(query = "") {
  const normalized = query.toLowerCase();
  const matched = [];

  for (const item of KNOWLEDGE_BASE) {
    const isMatch = item.keywords.some((kw) => normalized.includes(kw));
    if (isMatch) {
      matched.push(item);
    }
  }

  return matched;
}

module.exports = {
  KNOWLEDGE_BASE,
  retrieveRelevantKnowledge,
};
