const { retrieveRelevantKnowledge } = require("./knowledge.service");

function formatINR(amount = 0) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function generateGroundedAnswer(question, context) {
  const q = question.toLowerCase();

  // If user has no transaction records
  if (!context || !context.hasData) {
    return {
      content:
        "You currently don't have any transactions recorded in your FinSight AI account. " +
        "Please add a transaction or import a statement via the **CSV Upload** tab to generate your income, expense, and health score analytics.",
      source: "system",
    };
  }

  const { summary, health, topCategories, features, userName } = context;

  // 1. Health Score Inquiry
  if (q.includes("health") || q.includes("score")) {
    if (!health || health.score === null) {
      return {
        content:
          `Hello ${userName}, we cannot calculate a financial health score yet because no positive income has been recorded. ` +
          "Add at least one income transaction to establish your baseline score.",
        source: "user_data",
      };
    }

    const topExpCategory = topCategories[0]?.category || "your expenses";
    return {
      content:
        `Your current **Financial Health Score is ${health.score}/100 (${health.label})**.\n\n` +
        `• **Savings Rate:** ${summary.savingsRate}% (${health.savingsPoints}/60 points)\n` +
        `• **Expense-to-Income:** ${health.expenseRatio}% (${health.expensePoints}/40 points)\n\n` +
        `**Key Observation:** You have recorded **${formatINR(summary.totalIncome)}** in income and **${formatINR(summary.totalExpenses)}** in expenses, leaving **${formatINR(summary.netSavings)}** in net savings. ` +
        `Your largest spending area is **${topExpCategory}**.\n\n` +
        `*Educational note: This heuristic evaluates recorded cash flow only and does not track external assets, debt obligations, or investments.*`,
      source: "user_data",
    };
  }

  // 2. What-If Simulation & Scenario Analysis Inquiry
  if (
    q.includes("what if") ||
    q.includes("simulate") ||
    q.includes("simulation") ||
    q.includes("scenario") ||
    q.includes("afford") ||
    q.includes("i simulated")
  ) {
    const topCat = topCategories[0] || { category: "Discretionary Spending", amount: Math.round(summary.totalExpenses * 0.3) };
    const simulatedCut = Math.round(topCat.amount * 0.2);
    const newSavings = summary.netSavings + simulatedCut;
    const newSavingsRate = summary.totalIncome > 0 ? Number(((newSavings / summary.totalIncome) * 100).toFixed(1)) : 0;

    return {
      content:
        `### FinSight Scenario Intelligence\n\n` +
        `Simulating changes on your baseline data (**${formatINR(summary.totalIncome)}** income, **${formatINR(summary.totalExpenses)}** expenses):\n\n` +
        `• **Current Savings:** ${formatINR(summary.netSavings)} (${summary.savingsRate}% savings rate)\n` +
        `• **Target Opportunity:** Reducing **${topCat.category}** by 20% would free up approximately **${formatINR(simulatedCut)}/month**.\n` +
        `• **Projected Outcome:** Net savings would increase to **${formatINR(newSavings)}** (raising your savings rate to **${newSavingsRate}%**).\n\n` +
        `💡 *To test custom income adjustments, multiple category percentage sliders, EMI affordability, and savings goals in real-time, visit the **What-If Simulation** page from the sidebar.*`,
      source: "simulation_engine",
    };
  }

  // 3. Spending Breakdown & Top Categories Inquiry
  if (
    q.includes("spend") ||
    q.includes("category") ||
    q.includes("categories") ||
    q.includes("expense") ||
    q.includes("where did my money go")
  ) {
    if (!topCategories || topCategories.length === 0) {
      return {
        content:
          `You have no expense transactions recorded yet. Total income recorded is ${formatINR(summary.totalIncome)}.`,
        source: "user_data",
      };
    }

    const categoryLines = topCategories
      .map((c, i) => `${i + 1}. **${c.category}:** ${formatINR(c.amount)} (${c.percentage}% of total expenses)`)
      .join("\n");

    const topOne = topCategories[0];
    return {
      content:
        `Here is your recorded spending breakdown (total expenses: **${formatINR(summary.totalExpenses)}**):\n\n` +
        `${categoryLines}\n\n` +
        `**Primary Outflow:** **${topOne.category}** represents your highest single expense category at ${topOne.percentage}% of all recorded spending. ` +
        `Reviewing discretionary transactions in this category is often the fastest way to increase your net monthly savings.`,
      source: "user_data",
    };
  }

  // 3. Savings Rate & Cash Flow Inquiry
  if (q.includes("saving") || q.includes("save") || q.includes("surplus") || q.includes("net")) {
    const isPositive = summary.netSavings >= 0;
    return {
      content:
        `Your recorded **Savings Rate is ${summary.savingsRate}%**.\n\n` +
        `• **Total Income:** ${formatINR(summary.totalIncome)}\n` +
        `• **Total Expenses:** ${formatINR(summary.totalExpenses)}\n` +
        `• **Net Cash Flow:** ${isPositive ? "+" : ""}${formatINR(summary.netSavings)}\n\n` +
        (isPositive
          ? `You have a healthy surplus across your recorded history. A standard benchmark is to direct at least 20% of income toward savings or debt reduction.`
          : `⚠ Your recorded expenses exceed your income by ${formatINR(Math.abs(summary.netSavings))}. Review your category breakdown to eliminate non-essential expenses.`),
      source: "user_data",
    };
  }

  // 5. Financial Concepts / General Education (RAG retrieval)
  const educationalMatches = retrieveRelevantKnowledge(question);
  if (educationalMatches.length > 0) {
    const matched = educationalMatches[0];
    return {
      content:
        `### ${matched.topic}\n\n` +
        `${matched.summary}\n\n` +
        `**How this applies to your data:**\n` +
        `Your current recorded savings rate is **${summary.savingsRate}%** with **${formatINR(summary.netSavings)}** in net savings. ${matched.action}\n\n` +
        `*Educational benchmark — illustrative guidance, not certified financial advice.*`,
      source: "general_education",
    };
  }

  // 5. Unrecorded topics (Investments, Crypto, Stocks)
  if (q.includes("invest") || q.includes("crypto") || q.includes("stock") || q.includes("mutual fund") || q.includes("gold")) {
    return {
      content:
        `FinSight AI does not currently have records of investment accounts, mutual funds, or cryptocurrency for your profile. ` +
        `Your current data contains **${context.totalTransactions} recorded cashflow transactions** totaling ${formatINR(summary.totalIncome)} in income and ${formatINR(summary.totalExpenses)} in expenses.`,
      source: "system",
    };
  }

  // 6. Comprehensive Overview (Default Answer)
  return {
    content:
      `Hello ${userName}, here is an overview of your current financial intelligence summary:\n\n` +
      `• **Income:** ${formatINR(summary.totalIncome)}\n` +
      `• **Expenses:** ${formatINR(summary.totalExpenses)}\n` +
      `• **Net Savings:** ${formatINR(summary.netSavings)} (Savings Rate: **${summary.savingsRate}%**)\n` +
      `• **Health Score:** **${health.score ?? "—"}/100** (${health.label})\n` +
      (topCategories[0] ? `• **Highest Expense:** ${topCategories[0].category} (${topCategories[0].percentage}% of expenses)\n\n` : "\n") +
      `You can ask me specific questions like: *"Why is my health score ${health.score}?"*, *"Break down my spending"*, or *"Explain the 50/30/20 rule"*.`,
    source: "hybrid",
  };
}

async function askCopilot(question, context) {
  // If third-party LLM key is configured in environment, attempt external call with timeout
  if (process.env.LLM_API_KEY && process.env.LLM_API_KEY.trim().length > 5) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const promptPayload = {
        model: process.env.LLM_MODEL || "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are FinSight AI Copilot, a friendly and accurate personal finance intelligence assistant. " +
              "Answer user questions strictly based on the following verified user financial facts:\n" +
              JSON.stringify(context) +
              "\n\nRules:\n" +
              "1. Quote real numbers only from the provided context.\n" +
              "2. If an asset or detail is not in the context, state that it is not recorded.\n" +
              "3. Clarify that this is educational guidance, not licensed advice.",
          },
          { role: "user", content: question },
        ],
        temperature: 0.3,
      };

      const res = await fetch(
        process.env.LLM_API_URL || "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.LLM_API_KEY}`,
          },
          body: JSON.stringify(promptPayload),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        const content = json.choices?.[0]?.message?.content;
        if (content) {
          return { content, source: "user_data" };
        }
      }
    } catch (err) {
      console.warn("External LLM provider call failed, falling back to local reasoner:", err.message);
    }
  }

  // Grounded Deterministic Financial Reasoner
  return generateGroundedAnswer(question, context);
}

module.exports = {
  formatINR,
  generateGroundedAnswer,
  askCopilot,
};
