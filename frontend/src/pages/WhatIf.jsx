import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";
import {
  runSimulation,
  getSavedScenarios,
  saveScenario,
  deleteSavedScenario,
} from "../services/api";

function formatCurrency(val) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val || 0);
}

function WhatIf() {
  const navigate = useNavigate();

  // State
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [error, setError] = useState("");
  const [simulationData, setSimulationData] = useState(null);

  // Adjustments
  const [incomeMode, setIncomeMode] = useState("amount"); // "amount" | "percent"
  const [monthlyIncomeDelta, setMonthlyIncomeDelta] = useState(0);
  const [incomePercentChange, setIncomePercentChange] = useState(0);
  const [categoryAdjustments, setCategoryAdjustments] = useState({});
  const [additionalMonthlyExpense, setAdditionalMonthlyExpense] = useState(0);

  // Target Goal
  const [goalName, setGoalName] = useState("Emergency Reserve");
  const [goalAmount, setGoalAmount] = useState(100000);

  // Saved Scenarios
  const [savedScenarios, setSavedScenarios] = useState([]);
  const [showSavedModal, setShowSavedModal] = useState(false);
  const [saveScenarioName, setSaveScenarioName] = useState("");
  const [savingScenario, setSavingScenario] = useState(false);
  const [scenarioSuccessMsg, setScenarioSuccessMsg] = useState("");

  const debounceTimerRef = useRef(null);

  // Fetch initial baseline and saved scenarios
  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        setError("");
        const [simRes, scenariosRes] = await Promise.all([
          runSimulation({
            monthlyIncomeDelta: 0,
            incomePercentChange: 0,
            categoryAdjustments: {},
            additionalMonthlyExpense: 0,
            targetGoal: { name: "Emergency Reserve", targetAmount: 100000 },
          }),
          getSavedScenarios().catch(() => []),
        ]);

        setSimulationData(simRes);
        setSavedScenarios(scenariosRes || []);
      } catch (err) {
        setError(err.message || "Failed to initialize simulation baseline.");
      } finally {
        setLoading(false);
      }
    }

    init();
  }, []);

  // Debounced API simulation calculation
  const triggerSimulation = useCallback(
    (newAdjustments) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(async () => {
        try {
          setSimulating(true);
          const res = await runSimulation(newAdjustments);
          setSimulationData(res);
        } catch (err) {
          setError(err.message || "Simulation calculation failed.");
        } finally {
          setSimulating(false);
        }
      }, 250);
    },
    []
  );

  function handleCategorySliderChange(catName, percent) {
    const updated = {
      ...categoryAdjustments,
      [catName]: Number(percent),
    };
    setCategoryAdjustments(updated);

    triggerSimulation({
      monthlyIncomeDelta: incomeMode === "amount" ? monthlyIncomeDelta : 0,
      incomePercentChange: incomeMode === "percent" ? incomePercentChange : 0,
      categoryAdjustments: updated,
      additionalMonthlyExpense,
      targetGoal: { name: goalName, targetAmount: goalAmount },
    });
  }

  function handleIncomeChange(val, mode) {
    const num = Number(val) || 0;
    if (mode === "amount") {
      setMonthlyIncomeDelta(num);
      triggerSimulation({
        monthlyIncomeDelta: num,
        incomePercentChange: 0,
        categoryAdjustments,
        additionalMonthlyExpense,
        targetGoal: { name: goalName, targetAmount: goalAmount },
      });
    } else {
      setIncomePercentChange(num);
      triggerSimulation({
        monthlyIncomeDelta: 0,
        incomePercentChange: num,
        categoryAdjustments,
        additionalMonthlyExpense,
        targetGoal: { name: goalName, targetAmount: goalAmount },
      });
    }
  }

  function handleAddlExpenseChange(val) {
    const num = Math.max(0, Number(val) || 0);
    setAdditionalMonthlyExpense(num);
    triggerSimulation({
      monthlyIncomeDelta: incomeMode === "amount" ? monthlyIncomeDelta : 0,
      incomePercentChange: incomeMode === "percent" ? incomePercentChange : 0,
      categoryAdjustments,
      additionalMonthlyExpense: num,
      targetGoal: { name: goalName, targetAmount: goalAmount },
    });
  }

  function handleGoalChange(name, amount) {
    setGoalName(name);
    const amt = Math.max(0, Number(amount) || 0);
    setGoalAmount(amt);
    triggerSimulation({
      monthlyIncomeDelta: incomeMode === "amount" ? monthlyIncomeDelta : 0,
      incomePercentChange: incomeMode === "percent" ? incomePercentChange : 0,
      categoryAdjustments,
      additionalMonthlyExpense,
      targetGoal: { name, targetAmount: amt },
    });
  }

  // Presets
  function applyPreset(type) {
    let nextIncomeDelta = 0;
    let nextIncomePct = 0;
    let nextCatAdjustments = {};
    let nextAddlExpense = 0;

    const categories = simulationData?.categoryComparison || [];

    if (type === "frugal") {
      // Cut discretionary categories by 20% to 30%
      categories.forEach((c) => {
        const lower = c.category.toLowerCase();
        if (
          lower.includes("food") ||
          lower.includes("dining") ||
          lower.includes("restaurant") ||
          lower.includes("shopping") ||
          lower.includes("entertainment")
        ) {
          nextCatAdjustments[c.category] = -25;
        }
      });
    } else if (type === "raise") {
      nextIncomePct = 15;
      setIncomeMode("percent");
    } else if (type === "emi") {
      nextAddlExpense = 10000;
    } else if (type === "reset") {
      setIncomeMode("amount");
    }

    setMonthlyIncomeDelta(nextIncomeDelta);
    setIncomePercentChange(nextIncomePct);
    setCategoryAdjustments(nextCatAdjustments);
    setAdditionalMonthlyExpense(nextAddlExpense);

    triggerSimulation({
      monthlyIncomeDelta: nextIncomeDelta,
      incomePercentChange: nextIncomePct,
      categoryAdjustments: nextCatAdjustments,
      additionalMonthlyExpense: nextAddlExpense,
      targetGoal: { name: goalName, targetAmount: goalAmount },
    });
  }

  // Save Scenario
  async function handleSaveScenario(e) {
    e.preventDefault();
    if (!saveScenarioName.trim()) return;

    try {
      setSavingScenario(true);
      setError("");
      const outcome = {
        baselineIncome: simulationData.baseline.monthlyIncome,
        simulatedIncome: simulationData.simulated.monthlyIncome,
        baselineExpenses: simulationData.baseline.monthlyExpenses,
        simulatedExpenses: simulationData.simulated.monthlyExpenses,
        baselineSavings: simulationData.baseline.monthlySavings,
        simulatedSavings: simulationData.simulated.monthlySavings,
        baselineSavingsRate: simulationData.baseline.savingsRate,
        simulatedSavingsRate: simulationData.simulated.savingsRate,
        baselineScore: simulationData.baseline.health?.score ?? null,
        simulatedScore: simulationData.simulated.health?.score ?? null,
        annualDelta: simulationData.deltas.annualSavings,
        monthsToGoalBase: simulationData.goalFeasibility?.monthsToGoalBase ?? null,
        monthsToGoalSim: simulationData.goalFeasibility?.monthsToGoalSim ?? null,
      };

      const res = await saveScenario({
        name: saveScenarioName.trim(),
        adjustments: {
          monthlyIncomeDelta,
          incomePercentChange,
          categoryAdjustments,
          additionalMonthlyExpense,
          targetGoal: { name: goalName, targetAmount: goalAmount },
        },
        simulatedOutcome: outcome,
      });

      if (res.scenario) {
        setSavedScenarios((prev) => [res.scenario, ...prev]);
        setScenarioSuccessMsg(`Scenario "${saveScenarioName}" saved successfully!`);
        setTimeout(() => setScenarioSuccessMsg(""), 3500);
        setSaveScenarioName("");
        setShowSavedModal(false);
      }
    } catch (err) {
      setError(err.message || "Failed to save scenario.");
    } finally {
      setSavingScenario(false);
    }
  }

  async function handleDeleteSavedScenario(id) {
    if (!window.confirm("Delete this saved scenario?")) return;
    try {
      await deleteSavedScenario(id);
      setSavedScenarios((prev) => prev.filter((s) => s._id !== id));
    } catch (err) {
      setError(err.message || "Failed to delete scenario.");
    }
  }

  function handleLoadSavedScenario(sc) {
    const adj = sc.adjustments || {};
    setMonthlyIncomeDelta(adj.monthlyIncomeDelta || 0);
    setIncomePercentChange(adj.incomePercentChange || 0);
    if (adj.incomePercentChange) {
      setIncomeMode("percent");
    } else {
      setIncomeMode("amount");
    }
    const catMap = adj.categoryAdjustments
      ? adj.categoryAdjustments instanceof Map
        ? Object.fromEntries(adj.categoryAdjustments)
        : adj.categoryAdjustments
      : {};
    setCategoryAdjustments(catMap);
    setAdditionalMonthlyExpense(adj.additionalMonthlyExpense || 0);
    if (adj.targetGoal) {
      setGoalName(adj.targetGoal.name || "Emergency Reserve");
      setGoalAmount(adj.targetGoal.targetAmount || 100000);
    }

    triggerSimulation(adj);
    setScenarioSuccessMsg(`Loaded scenario: "${sc.name}"`);
    setTimeout(() => setScenarioSuccessMsg(""), 3000);
  }

  function handleAskCopilotAboutScenario() {
    if (!simulationData) return;
    const { baseline, simulated, deltas, goalFeasibility } = simulationData;

    const promptText =
      `I simulated a financial scenario in FinSight:\n` +
      `• Monthly Income: ${formatCurrency(baseline.monthlyIncome)} → ${formatCurrency(simulated.monthlyIncome)} (${deltas.income >= 0 ? "+" : ""}${formatCurrency(deltas.income)})\n` +
      `• Monthly Expenses: ${formatCurrency(baseline.monthlyExpenses)} → ${formatCurrency(simulated.monthlyExpenses)} (${deltas.expenses >= 0 ? "+" : ""}${formatCurrency(deltas.expenses)})\n` +
      `• Net Savings: ${formatCurrency(baseline.monthlySavings)} → ${formatCurrency(simulated.monthlySavings)} (${deltas.savings >= 0 ? "+" : ""}${formatCurrency(deltas.savings)}/mo)\n` +
      `• Savings Rate: ${baseline.savingsRate}% → ${simulated.savingsRate}%\n` +
      `• Health Score: ${baseline.health?.score ?? "—"}/100 → ${simulated.health?.score ?? "—"}/100\n` +
      (goalFeasibility
        ? `• Target Goal (${goalFeasibility.name}): ${goalFeasibility.monthsToGoalSim ? `${goalFeasibility.monthsToGoalSim} months` : "Unreachable"}\n`
        : "") +
      `How sustainable is this plan and what trade-offs should I consider?`;

    navigate("/copilot", { state: { initialPrompt: promptText } });
  }

  const baseline = simulationData?.baseline;
  const simulated = simulationData?.simulated;
  const deltas = simulationData?.deltas;
  const categoryComparison = simulationData?.categoryComparison || [];
  const goal = simulationData?.goalFeasibility;
  const insights = simulationData?.insights || [];

  // Recharts Comparison Data
  const comparisonChartData = baseline && simulated
    ? [
        {
          metric: "Income",
          Baseline: baseline.monthlyIncome,
          Simulated: simulated.monthlyIncome,
        },
        {
          metric: "Expenses",
          Baseline: baseline.monthlyExpenses,
          Simulated: simulated.monthlyExpenses,
        },
        {
          metric: "Net Savings",
          Baseline: Math.max(0, baseline.monthlySavings),
          Simulated: Math.max(0, simulated.monthlySavings),
        },
      ]
    : [];

  return (
    <div className="app-shell">
      <Sidebar />

      <main className="main-panel">
        <Navbar />

        <section className="dashboard-content">
          {/* Header & Presets */}
          <div className="welcome-row">
            <div>
              <p className="eyebrow">PREDICTIVE INTELLIGENCE & EXPERIMENTATION</p>
              <h2>What-If Financial Simulator</h2>
              <p className="muted">
                Model hypothetical raises, category spending reductions, and new loans. Real transaction records remain completely unchanged.
              </p>
            </div>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
              <button
                type="button"
                className="secondary-btn"
                onClick={() => setShowSavedModal(true)}
                disabled={!simulationData}
              >
                💾 Save Scenario
              </button>

              <button
                type="button"
                className="primary-btn"
                onClick={handleAskCopilotAboutScenario}
                disabled={!simulationData}
                style={{ backgroundColor: "#10b981" }}
              >
                ✧ Discuss with Copilot
              </button>
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div
            style={{
              display: "flex",
              gap: "8px",
              flexWrap: "wrap",
              margin: "12px 0 24px",
              padding: "12px 16px",
              backgroundColor: "rgba(18, 28, 45, 0.7)",
              borderRadius: "12px",
              border: "1px solid #1f2e46",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 600 }}>QUICK PRESETS:</span>
            <button
              type="button"
              className="chip-btn"
              onClick={() => applyPreset("frugal")}
              title="Cut dining & shopping by 25%"
            >
              🌿 Frugal Month (-25% Dining & Shopping)
            </button>
            <button
              type="button"
              className="chip-btn"
              onClick={() => applyPreset("raise")}
              title="Add 15% salary hike"
            >
              🚀 Career Boost (+15% Income)
            </button>
            <button
              type="button"
              className="chip-btn"
              onClick={() => applyPreset("emi")}
              title="Simulate adding ₹10,000 monthly EMI"
            >
              🚗 New Car EMI (+₹10,000 Outflow)
            </button>
            <button
              type="button"
              className="chip-btn danger"
              onClick={() => applyPreset("reset")}
              title="Reset all adjustments to 0"
            >
              ↺ Reset to Baseline
            </button>

            {simulating && (
              <span style={{ fontSize: "12px", color: "#60a5fa", marginLeft: "auto" }}>
                Calculating simulation...
              </span>
            )}
          </div>

          {scenarioSuccessMsg && (
            <div
              style={{
                backgroundColor: "rgba(16, 185, 129, 0.15)",
                border: "1px solid #10b981",
                color: "#6ee7b7",
                padding: "10px 16px",
                borderRadius: "8px",
                marginBottom: "16px",
                fontSize: "14px",
              }}
            >
              ✓ {scenarioSuccessMsg}
            </div>
          )}

          {error && (
            <div
              style={{
                backgroundColor: "rgba(239, 68, 68, 0.15)",
                border: "1px solid #ef4444",
                color: "#fca5a5",
                padding: "10px 16px",
                borderRadius: "8px",
                marginBottom: "16px",
                fontSize: "14px",
              }}
            >
              ⚠ {error}
            </div>
          )}

          {loading ? (
            <div style={{ padding: "64px 0", textAlign: "center", color: "#94a3b8" }}>
              <p>Loading historical financial baseline...</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: "24px" }}>
              {/* Left Column: Interactive Adjustment Controls */}
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {/* Income Adjustment Card */}
                <div className="card" style={{ padding: "20px" }}>
                  <h3 style={{ fontSize: "16px", marginBottom: "8px", color: "#f1f5fb" }}>
                    1. Monthly Income Adjustment
                  </h3>
                  <p style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "14px" }}>
                    Baseline Income: <strong>{formatCurrency(baseline?.monthlyIncome)}/mo</strong>
                  </p>

                  <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                    <button
                      type="button"
                      className={`chip-btn ${incomeMode === "amount" ? "active" : ""}`}
                      onClick={() => {
                        setIncomeMode("amount");
                        handleIncomeChange(monthlyIncomeDelta, "amount");
                      }}
                    >
                      Fixed INR (₹)
                    </button>
                    <button
                      type="button"
                      className={`chip-btn ${incomeMode === "percent" ? "active" : ""}`}
                      onClick={() => {
                        setIncomeMode("percent");
                        handleIncomeChange(incomePercentChange, "percent");
                      }}
                    >
                      Percentage (%)
                    </button>
                  </div>

                  {incomeMode === "amount" ? (
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "4px" }}>
                        <span className="muted">Change (₹):</span>
                        <strong style={{ color: monthlyIncomeDelta >= 0 ? "#34d399" : "#f87171" }}>
                          {monthlyIncomeDelta >= 0 ? `+₹${monthlyIncomeDelta.toLocaleString("en-IN")}` : `-₹${Math.abs(monthlyIncomeDelta).toLocaleString("en-IN")}`}
                        </strong>
                      </div>
                      <input
                        type="range"
                        min="-50000"
                        max="100000"
                        step="1000"
                        value={monthlyIncomeDelta}
                        onChange={(e) => handleIncomeChange(e.target.value, "amount")}
                        style={{ width: "100%", accentColor: "#10b981" }}
                      />
                    </div>
                  ) : (
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "4px" }}>
                        <span className="muted">Percentage Change:</span>
                        <strong style={{ color: incomePercentChange >= 0 ? "#34d399" : "#f87171" }}>
                          {incomePercentChange >= 0 ? `+${incomePercentChange}%` : `${incomePercentChange}%`}
                        </strong>
                      </div>
                      <input
                        type="range"
                        min="-50"
                        max="100"
                        step="5"
                        value={incomePercentChange}
                        onChange={(e) => handleIncomeChange(e.target.value, "percent")}
                        style={{ width: "100%", accentColor: "#10b981" }}
                      />
                    </div>
                  )}
                </div>

                {/* Category Reductions Card */}
                <div className="card" style={{ padding: "20px" }}>
                  <h3 style={{ fontSize: "16px", marginBottom: "8px", color: "#f1f5fb" }}>
                    2. Category Spending Adjustments
                  </h3>
                  <p style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "14px" }}>
                    Slide left to cut expenses, right to increase:
                  </p>

                  {categoryComparison.length === 0 ? (
                    <p style={{ fontSize: "13px", color: "#94a3b8" }}>No expense categories recorded yet.</p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                      {categoryComparison.map((cat) => {
                        const pct = categoryAdjustments[cat.category] || 0;
                        const isCut = pct < 0;
                        const isHike = pct > 0;

                        return (
                          <div key={cat.category} style={{ borderBottom: "1px solid #1f2e46", paddingBottom: "10px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "2px" }}>
                              <strong>{cat.category}</strong>
                              <span style={{ color: isCut ? "#34d399" : isHike ? "#f87171" : "#94a3b8" }}>
                                {pct > 0 ? `+${pct}%` : `${pct}%`} ({formatCurrency(cat.simulatedAmount)})
                              </span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#94a3b8", marginBottom: "6px" }}>
                              <span>Baseline: {formatCurrency(cat.baselineAmount)}/mo</span>
                              {cat.deltaAmount !== 0 && (
                                <span style={{ color: isCut ? "#34d399" : "#f87171" }}>
                                  {isCut ? `Saves ${formatCurrency(Math.abs(cat.deltaAmount))}` : `+${formatCurrency(cat.deltaAmount)}`}
                                </span>
                              )}
                            </div>
                            <input
                              type="range"
                              min="-100"
                              max="100"
                              step="5"
                              value={pct}
                              onChange={(e) => handleCategorySliderChange(cat.category, e.target.value)}
                              style={{ width: "100%", accentColor: isCut ? "#10b981" : isHike ? "#ef4444" : "#60a5fa" }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Additional Fixed Expense / Loan */}
                <div className="card" style={{ padding: "20px" }}>
                  <h3 style={{ fontSize: "16px", marginBottom: "8px", color: "#f1f5fb" }}>
                    3. Additional Monthly Outflow (EMI / Rent)
                  </h3>
                  <p style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "12px" }}>
                    Test recurring obligations like a new car loan, appliance EMI, or housing upgrade.
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ color: "#94a3b8" }}>₹</span>
                    <input
                      type="number"
                      min="0"
                      step="500"
                      value={additionalMonthlyExpense}
                      onChange={(e) => handleAddlExpenseChange(e.target.value)}
                      placeholder="0"
                      style={{
                        flex: 1,
                        background: "#0c1524",
                        border: "1px solid #1f2e46",
                        color: "#f1f5fb",
                        padding: "8px 12px",
                        borderRadius: "8px",
                      }}
                    />
                  </div>
                </div>

                {/* Target Savings Goal */}
                <div className="card" style={{ padding: "20px" }}>
                  <h3 style={{ fontSize: "16px", marginBottom: "8px", color: "#f1f5fb" }}>
                    4. Target Savings Goal
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <input
                      type="text"
                      value={goalName}
                      onChange={(e) => handleGoalChange(e.target.value, goalAmount)}
                      placeholder="Goal Name (e.g. Vacation, Bike)"
                      style={{
                        background: "#0c1524",
                        border: "1px solid #1f2e46",
                        color: "#f1f5fb",
                        padding: "8px 12px",
                        borderRadius: "8px",
                        fontSize: "13px",
                      }}
                    />
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ color: "#94a3b8" }}>₹</span>
                      <input
                        type="number"
                        min="1000"
                        step="5000"
                        value={goalAmount}
                        onChange={(e) => handleGoalChange(goalName, e.target.value)}
                        placeholder="Target Amount"
                        style={{
                          flex: 1,
                          background: "#0c1524",
                          border: "1px solid #1f2e46",
                          color: "#f1f5fb",
                          padding: "8px 12px",
                          borderRadius: "8px",
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Dynamic Simulation Results & Charts */}
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                {/* Delta Metric Summary Cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "12px" }}>
                  {/* Monthly Income Card */}
                  <div className="stat-card">
                    <span className="stat-label">MONTHLY INCOME</span>
                    <strong className="stat-value">{formatCurrency(simulated?.monthlyIncome)}</strong>
                    <div style={{ fontSize: "12px", marginTop: "4px" }}>
                      <span className="muted">Base: {formatCurrency(baseline?.monthlyIncome)} </span>
                      {deltas?.income !== 0 && (
                        <span style={{ color: deltas?.income > 0 ? "#34d399" : "#f87171", fontWeight: 600 }}>
                          ({deltas?.income > 0 ? `+${formatCurrency(deltas?.income)}` : `-${formatCurrency(Math.abs(deltas?.income))}`})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Monthly Expenses Card */}
                  <div className="stat-card">
                    <span className="stat-label">MONTHLY EXPENSES</span>
                    <strong className="stat-value">{formatCurrency(simulated?.monthlyExpenses)}</strong>
                    <div style={{ fontSize: "12px", marginTop: "4px" }}>
                      <span className="muted">Base: {formatCurrency(baseline?.monthlyExpenses)} </span>
                      {deltas?.expenses !== 0 && (
                        <span style={{ color: deltas?.expenses < 0 ? "#34d399" : "#f87171", fontWeight: 600 }}>
                          ({deltas?.expenses < 0 ? `Saves ${formatCurrency(Math.abs(deltas?.expenses))}` : `+${formatCurrency(deltas?.expenses)}`})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Net Monthly Savings Card */}
                  <div className="stat-card">
                    <span className="stat-label">NET MONTHLY SURPLUS</span>
                    <strong
                      className="stat-value"
                      style={{ color: simulated?.monthlySavings >= 0 ? "#34d399" : "#f87171" }}
                    >
                      {formatCurrency(simulated?.monthlySavings)}
                    </strong>
                    <div style={{ fontSize: "12px", marginTop: "4px" }}>
                      <span className="muted">Rate: {simulated?.savingsRate}% </span>
                      {deltas?.savingsRate !== 0 && (
                        <span style={{ color: deltas?.savingsRate > 0 ? "#34d399" : "#f87171", fontWeight: 600 }}>
                          ({deltas?.savingsRate > 0 ? `+${deltas?.savingsRate}%` : `${deltas?.savingsRate}%`})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Health Score Card */}
                  <div className="stat-card">
                    <span className="stat-label">HEALTH SCORE</span>
                    <strong className="stat-value" style={{ color: "#60a5fa" }}>
                      {simulated?.health?.score ?? "—"}/100
                    </strong>
                    <div style={{ fontSize: "12px", marginTop: "4px" }}>
                      <span className="muted">Base: {baseline?.health?.score ?? "—"} </span>
                      {deltas?.score !== null && deltas?.score !== 0 && (
                        <span style={{ color: deltas?.score > 0 ? "#34d399" : "#f87171", fontWeight: 600 }}>
                          ({deltas?.score > 0 ? `+${deltas?.score} pts` : `${deltas?.score} pts`})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Annual Impact Card */}
                  <div className="stat-card">
                    <span className="stat-label">1-YEAR SURPLUS GAIN</span>
                    <strong
                      className="stat-value"
                      style={{ color: deltas?.annualSavings >= 0 ? "#34d399" : "#f87171" }}
                    >
                      {deltas?.annualSavings >= 0 ? `+${formatCurrency(deltas?.annualSavings)}` : `-${formatCurrency(Math.abs(deltas?.annualSavings))}`}
                    </strong>
                    <div style={{ fontSize: "12px", marginTop: "4px" }}>
                      <span className="muted">Annual projection</span>
                    </div>
                  </div>
                </div>

                {/* Target Goal Timeline Banner */}
                {goal && (
                  <div
                    style={{
                      background: "linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(59, 130, 246, 0.08) 100%)",
                      border: "1px solid rgba(16, 185, 129, 0.3)",
                      borderRadius: "14px",
                      padding: "18px 24px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "16px",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "12px", color: "#6ee7b7", fontWeight: 600, letterSpacing: "0.5px" }}>
                        🎯 GOAL FEASIBILITY: {goal.name.toUpperCase()} ({formatCurrency(goal.targetAmount)})
                      </div>
                      <div style={{ fontSize: "16px", color: "#f1f5fb", marginTop: "4px" }}>
                        {goal.isReachableSimulated ? (
                          <span>
                            Under this scenario, you will reach your goal in{" "}
                            <strong style={{ color: "#34d399" }}>{goal.monthsToGoalSim} months</strong>.
                            {goal.monthsSaved !== null && goal.monthsSaved > 0 && (
                              <span style={{ color: "#60a5fa" }}> That saves you {goal.monthsSaved} months!</span>
                            )}
                          </span>
                        ) : (
                          <span style={{ color: "#f87171" }}>
                            Unreachable under this scenario due to zero or negative net monthly savings.
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ fontSize: "13px", color: "#94a3b8" }}>
                      Baseline Timeline: {goal.monthsToGoalBase ? `${goal.monthsToGoalBase} months` : "Unreachable"}
                    </div>
                  </div>
                )}

                {/* Visual Chart Comparison */}
                <div className="card" style={{ padding: "20px" }}>
                  <h3 style={{ fontSize: "16px", marginBottom: "4px", color: "#f1f5fb" }}>
                    Baseline vs. Simulated Cash Flow
                  </h3>
                  <p style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "16px" }}>
                    Visualizing how your income, expenses, and savings shift under this hypothetical scenario.
                  </p>

                  <div style={{ width: "100%", height: 260 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={comparisonChartData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2e46" />
                        <XAxis dataKey="metric" stroke="#94a3b8" />
                        <YAxis tickFormatter={(val) => `₹${val}`} stroke="#94a3b8" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#111c2d",
                            border: "1px solid #34445c",
                            borderRadius: "10px",
                            color: "#f1f5fb",
                          }}
                          formatter={(value) => [formatCurrency(value), ""]}
                        />
                        <Legend />
                        <Bar dataKey="Baseline" fill="#64748b" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Simulated" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Prescriptive Insights Takeaways */}
                <div className="card" style={{ padding: "20px" }}>
                  <h3 style={{ fontSize: "16px", marginBottom: "8px", color: "#f1f5fb" }}>
                    ✧ Scenario Prescriptions & Insights
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "12px" }}>
                    {insights.map((ins, idx) => {
                      let borderColor = "#1f2e46";
                      let textColor = "#f1f5fb";
                      let icon = "•";

                      if (ins.type === "positive") {
                        borderColor = "rgba(16, 185, 129, 0.4)";
                        textColor = "#a7f3d0";
                        icon = "✓";
                      } else if (ins.type === "warning") {
                        borderColor = "rgba(245, 158, 11, 0.4)";
                        textColor = "#fde68a";
                        icon = "⚠";
                      } else if (ins.type === "danger") {
                        borderColor = "rgba(239, 68, 68, 0.4)";
                        textColor = "#fca5a5";
                        icon = "✕";
                      }

                      return (
                        <div
                          key={idx}
                          style={{
                            padding: "10px 14px",
                            borderRadius: "8px",
                            backgroundColor: "rgba(15, 23, 42, 0.6)",
                            border: `1px solid ${borderColor}`,
                            fontSize: "13px",
                            color: textColor,
                            display: "flex",
                            alignItems: "flex-start",
                            gap: "8px",
                          }}
                        >
                          <span style={{ fontWeight: "bold" }}>{icon}</span>
                          <span>{ins.text}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Saved Scenarios List */}
                {savedScenarios.length > 0 && (
                  <div className="card" style={{ padding: "20px" }}>
                    <h3 style={{ fontSize: "16px", marginBottom: "8px", color: "#f1f5fb" }}>
                      📁 Previously Saved Scenarios ({savedScenarios.length})
                    </h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "12px" }}>
                      {savedScenarios.map((sc) => (
                        <div
                          key={sc._id}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "12px 16px",
                            backgroundColor: "#0d1829",
                            borderRadius: "8px",
                            border: "1px solid #1f2e46",
                          }}
                        >
                          <div>
                            <strong style={{ color: "#f1f5fb", fontSize: "14px" }}>{sc.name}</strong>
                            <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>
                              Simulated Savings: {formatCurrency(sc.simulatedOutcome?.simulatedSavings)}/mo (
                              {sc.simulatedOutcome?.simulatedSavingsRate}%) · Health: {sc.simulatedOutcome?.simulatedScore ?? "—"}/100
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: "8px" }}>
                            <button
                              type="button"
                              className="chip-btn"
                              onClick={() => handleLoadSavedScenario(sc)}
                            >
                              Load
                            </button>
                            <button
                              type="button"
                              className="chip-btn danger"
                              onClick={() => handleDeleteSavedScenario(sc._id)}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Save Scenario Modal */}
          {showSavedModal && (
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0, 0, 0, 0.75)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1000,
                padding: "20px",
              }}
            >
              <div
                className="card"
                style={{
                  width: "100%",
                  maxWidth: "460px",
                  padding: "24px",
                  backgroundColor: "#111c2d",
                  border: "1px solid #34445c",
                }}
              >
                <h3 style={{ fontSize: "18px", color: "#f1f5fb", marginBottom: "8px" }}>
                  Save Simulation Scenario
                </h3>
                <p style={{ fontSize: "13px", color: "#94a3b8", marginBottom: "16px" }}>
                  Give this hypothetical plan a memorable name so you can reload or compare it anytime.
                </p>

                <form onSubmit={handleSaveScenario}>
                  <input
                    type="text"
                    required
                    maxLength={100}
                    value={saveScenarioName}
                    onChange={(e) => setSaveScenarioName(e.target.value)}
                    placeholder="e.g. Aggressive Debt Repayment or Post-Hike Plan"
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      background: "#0c1524",
                      border: "1px solid #1f2e46",
                      color: "#f1f5fb",
                      borderRadius: "8px",
                      marginBottom: "16px",
                      fontSize: "14px",
                    }}
                  />

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={() => setShowSavedModal(false)}
                      disabled={savingScenario}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="primary-btn"
                      disabled={savingScenario || !saveScenarioName.trim()}
                    >
                      {savingScenario ? "Saving..." : "Save Scenario"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default WhatIf;
