function formatCurrency(val) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val || 0);
}

function BudgetPacingCard({ data, loading, onOpenBudgetModal }) {
  if (loading) {
    return (
      <div className="panel" style={{ padding: "20px" }}>
        <p className="muted">Calculating budget pacing and burn rates...</p>
      </div>
    );
  }

  const budgets = data?.categoryBudgets || [];
  const totalBudget = data?.totalBudget || 0;
  const totalSpent = data?.totalSpent || 0;
  const monthElapsed = data?.monthElapsedPercent || 0;
  const asOfDay = data?.asOfDay || 1;
  const daysInMonth = data?.daysInMonth || 30;

  return (
    <section className="panel" style={{ marginTop: "22px" }}>
      <div className="panel-heading" style={{ marginBottom: "16px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "16px" }}>⏱</span>
            <h3 style={{ margin: 0, fontSize: "16px" }}>Category Budgets & Burn Rate Pacing</h3>
          </div>
          <p className="muted" style={{ margin: "4px 0 0" }}>
            Month Progress: <strong>Day {asOfDay} of {daysInMonth} ({monthElapsed}%)</strong> · Velocity-based overspend forecasting.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenBudgetModal}
          className="chip-btn"
          style={{ alignSelf: "flex-start", borderColor: "var(--accent-blue)" }}
        >
          ⚙ Manage Budgets
        </button>
      </div>

      {budgets.length === 0 ? (
        <div style={{ padding: "28px 16px", textAlign: "center", color: "var(--text-muted)" }}>
          <p style={{ margin: "0 0 12px", fontSize: "14px" }}>
            No monthly category budgets configured yet.
          </p>
          <button
            type="button"
            onClick={onOpenBudgetModal}
            className="primary-btn"
            style={{ padding: "8px 16px", fontSize: "12px" }}
          >
            + Set Your First Category Budget
          </button>
        </div>
      ) : (
        <div>
          {/* Overall Budget Progress */}
          <div style={{ marginBottom: "20px", padding: "12px 16px", backgroundColor: "var(--bg-card-subtle)", borderRadius: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "6px" }}>
              <span>
                Total Monthly Budget: <strong>{formatCurrency(totalSpent)}</strong> of <strong>{formatCurrency(totalBudget)}</strong>
              </span>
              <span style={{ fontWeight: "600", color: totalSpent > totalBudget ? "#f87171" : "#34d399" }}>
                {data?.totalPercentUsed}% spent ({data?.daysRemaining} days left)
              </span>
            </div>
            <div style={{ height: "8px", width: "100%", backgroundColor: "var(--border-card)", borderRadius: "4px", overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  width: `${Math.min(100, data?.totalPercentUsed || 0)}%`,
                  backgroundColor: totalSpent > totalBudget ? "#ef4444" : totalSpent / totalBudget > monthElapsed / 100 ? "#f59e0b" : "#10b981",
                  transition: "width 0.3s ease",
                }}
              />
            </div>
          </div>

          {/* Individual Category Pacing Bars */}
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {budgets.map((b) => {
              const isOver = b.status === "exceeded";
              const isAtRisk = b.status === "at_risk";
              const barColor = isOver ? "#ef4444" : isAtRisk ? "#f59e0b" : "#10b981";

              return (
                <div key={b.category} style={{ borderBottom: "1px solid var(--border-subtle)", paddingBottom: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                    <div>
                      <strong style={{ fontSize: "14px", color: "var(--text-primary)" }}>{b.category}</strong>
                      <span
                        style={{
                          marginLeft: "10px",
                          fontSize: "11px",
                          padding: "2px 8px",
                          borderRadius: "12px",
                          fontWeight: 600,
                          backgroundColor: isOver ? "rgba(239, 68, 68, 0.15)" : isAtRisk ? "rgba(245, 158, 11, 0.15)" : "rgba(16, 185, 129, 0.15)",
                          color: isOver ? "#f87171" : isAtRisk ? "#fbbf24" : "#34d399",
                        }}
                      >
                        {b.statusLabel}
                      </span>
                    </div>

                    <div style={{ fontSize: "13px" }}>
                      <strong>{formatCurrency(b.spent)}</strong>
                      <span className="muted"> / {formatCurrency(b.monthlyLimit)} ({b.percentUsed}%)</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div style={{ height: "6px", width: "100%", backgroundColor: "var(--border-card)", borderRadius: "3px", overflow: "hidden", margin: "6px 0" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${Math.min(100, b.percentUsed)}%`,
                        backgroundColor: barColor,
                        transition: "width 0.3s ease",
                      }}
                    />
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--text-muted)" }}>
                    <span>Daily Burn Rate: ~{formatCurrency(b.dailyVelocity)}/day</span>
                    <span>
                      {isOver ? (
                        <span style={{ color: "#f87171" }}>Over budget by {formatCurrency(b.spent - b.monthlyLimit)}</span>
                      ) : isAtRisk ? (
                        <span style={{ color: "#fbbf24" }}>Projected month-end: ~{formatCurrency(b.projectedMonthEnd)} (+{formatCurrency(b.projectedOverspend)})</span>
                      ) : (
                        <span style={{ color: "#34d399" }}>On track ({formatCurrency(b.remaining)} remaining)</span>
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

export default BudgetPacingCard;
