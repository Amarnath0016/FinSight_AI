function formatCurrency(val) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val || 0);
}

function SubscriptionsCard({ data, loading }) {
  if (loading) {
    return (
      <div className="panel" style={{ padding: "20px" }}>
        <p className="muted">Analyzing recurring subscriptions and auto-debits...</p>
      </div>
    );
  }

  const subscriptions = data?.subscriptions || [];
  const monthlyTotal = data?.totalMonthlyCommitment || 0;
  const annualTotal = data?.totalAnnualCommitment || 0;
  const insights = data?.insights || [];

  return (
    <section className="panel" style={{ marginTop: "22px" }}>
      <div className="panel-heading" style={{ marginBottom: "16px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "16px" }}>🔄</span>
            <h3 style={{ margin: 0, fontSize: "16px" }}>Recurring Subscriptions & Bills</h3>
          </div>
          <p className="muted" style={{ margin: "4px 0 0" }}>
            Algorithmic recurring outflow detection with automated price-creep tracking.
          </p>
        </div>

        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "16px", fontWeight: "700", color: "#34d399" }}>
            {formatCurrency(monthlyTotal)}
            <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "400" }}>/month</span>
          </div>
          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
            ≈ {formatCurrency(annualTotal)}/yr commitment
          </span>
        </div>
      </div>

      {subscriptions.length === 0 ? (
        <div style={{ padding: "24px 0", textAlign: "center", color: "var(--text-muted)" }}>
          <p style={{ margin: 0, fontSize: "13px" }}>
            No recurring monthly subscriptions detected yet. Regular monthly payments (like Netflix, Spotify, or Gym) will appear here automatically.
          </p>
        </div>
      ) : (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: "12px",
              marginBottom: "16px",
            }}
          >
            {subscriptions.map((sub) => (
              <div
                key={sub.id}
                style={{
                  padding: "14px",
                  borderRadius: "10px",
                  backgroundColor: "var(--bg-card-subtle)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                  <strong style={{ fontSize: "14px", color: "var(--text-primary)" }}>{sub.name}</strong>
                  <span style={{ fontSize: "14px", fontWeight: "700", color: "#60a5fa" }}>
                    {formatCurrency(sub.monthlyAmount)}
                  </span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--text-muted)", marginBottom: "8px" }}>
                  <span>{sub.category}</span>
                  <span>Charged: {sub.lastChargedDate}</span>
                </div>

                {sub.priceChange && sub.priceChange.hasChanged && (
                  <div
                    style={{
                      fontSize: "11px",
                      padding: "4px 8px",
                      borderRadius: "6px",
                      backgroundColor: sub.priceChange.delta > 0 ? "rgba(239, 68, 68, 0.15)" : "rgba(16, 185, 129, 0.15)",
                      color: sub.priceChange.delta > 0 ? "#f87171" : "#34d399",
                      fontWeight: 500,
                    }}
                  >
                    {sub.priceChange.delta > 0 ? "▲ Price increased" : "▼ Price decreased"} by {formatCurrency(Math.abs(sub.priceChange.delta))} ({sub.priceChange.percent}%)
                  </div>
                )}
              </div>
            ))}
          </div>

          {insights.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {insights.map((ins, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: "12px",
                    color: ins.type === "warning" ? "#fbbf24" : "var(--text-secondary)",
                    backgroundColor: "rgba(15, 23, 42, 0.4)",
                    padding: "6px 12px",
                    borderRadius: "6px",
                    borderLeft: `3px solid ${ins.type === "warning" ? "#f59e0b" : "#3b82f6"}`,
                  }}
                >
                  {ins.text}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default SubscriptionsCard;
