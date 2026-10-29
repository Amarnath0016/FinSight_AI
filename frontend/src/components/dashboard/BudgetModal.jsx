import { useState } from "react";

function BudgetModal({
  isOpen,
  onClose,
  categories = [],
  currentBudgets = [],
  onSaveBudget,
  onDeleteBudget,
}) {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [monthlyLimit, setMonthlyLimit] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    const cat = selectedCategory === "__custom__" ? customCategory.trim() : selectedCategory.trim();
    if (!cat) {
      setError("Please select or enter a category name");
      return;
    }
    const limitNum = Number(monthlyLimit);
    if (isNaN(limitNum) || limitNum <= 0) {
      setError("Please enter a valid positive monthly budget limit");
      return;
    }

    try {
      setSaving(true);
      setError("");
      await onSaveBudget(cat, limitNum);
      setSelectedCategory("");
      setCustomCategory("");
      setMonthlyLimit("");
    } catch (err) {
      setError(err.message || "Failed to save budget");
    } finally {
      setSaving(false);
    }
  }

  return (
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
          maxWidth: "480px",
          padding: "24px",
          backgroundColor: "var(--bg-surface)",
          border: "1px solid var(--border-card)",
          borderRadius: "14px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 style={{ margin: 0, fontSize: "18px", color: "var(--text-primary)" }}>
            Category Budget Limits
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-muted)",
              fontSize: "18px",
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>

        <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "16px" }}>
          Configure monthly spending caps for your frequent categories to monitor velocity and prevent overspending.
        </p>

        {error && (
          <div
            style={{
              padding: "8px 12px",
              borderRadius: "6px",
              backgroundColor: "rgba(239, 68, 68, 0.15)",
              color: "#f87171",
              fontSize: "13px",
              marginBottom: "14px",
            }}
          >
            ⚠ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ marginBottom: "20px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)" }}>
              Category
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                required
                style={{
                  width: "100%",
                  marginTop: "4px",
                  padding: "9px 12px",
                  borderRadius: "8px",
                  border: "1px solid var(--border-card)",
                  backgroundColor: "var(--input-bg)",
                  color: "var(--text-primary)",
                  fontSize: "13px",
                }}
              >
                <option value="">-- Choose Category --</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
                <option value="__custom__">+ Custom Category</option>
              </select>
            </label>

            {selectedCategory === "__custom__" && (
              <input
                type="text"
                placeholder="Enter category name"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: "8px",
                  border: "1px solid var(--border-card)",
                  backgroundColor: "var(--input-bg)",
                  color: "var(--text-primary)",
                  fontSize: "13px",
                }}
              />
            )}

            <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)" }}>
              Monthly Limit (₹)
              <input
                type="number"
                min="100"
                step="500"
                placeholder="e.g. 10000"
                value={monthlyLimit}
                onChange={(e) => setMonthlyLimit(e.target.value)}
                required
                style={{
                  width: "100%",
                  marginTop: "4px",
                  padding: "9px 12px",
                  borderRadius: "8px",
                  border: "1px solid var(--border-card)",
                  backgroundColor: "var(--input-bg)",
                  color: "var(--text-primary)",
                  fontSize: "13px",
                }}
              />
            </label>

            <button
              type="submit"
              disabled={saving}
              className="primary-btn"
              style={{ marginTop: "6px" }}
            >
              {saving ? "Saving..." : "+ Save Category Budget"}
            </button>
          </div>
        </form>

        {currentBudgets.length > 0 && (
          <div>
            <h4 style={{ fontSize: "13px", margin: "0 0 10px", color: "var(--text-primary)" }}>
              Existing Configured Budgets ({currentBudgets.length})
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "160px", overflowY: "auto" }}>
              {currentBudgets.map((b) => (
                <div
                  key={b._id || b.category}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 12px",
                    backgroundColor: "var(--bg-card-subtle)",
                    borderRadius: "6px",
                    fontSize: "12px",
                  }}
                >
                  <div>
                    <strong>{b.category}</strong>: ₹{Number(b.monthlyLimit).toLocaleString("en-IN")}/mo
                  </div>
                  {b._id && (
                    <button
                      type="button"
                      onClick={() => onDeleteBudget(b._id)}
                      className="chip-btn danger"
                      style={{ padding: "3px 8px", fontSize: "11px" }}
                    >
                      Delete
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default BudgetModal;
