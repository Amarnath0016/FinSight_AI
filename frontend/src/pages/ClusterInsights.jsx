import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";
import { getUserSegmentation } from "../services/api";

function ClusterInsights() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchInsights() {
      try {
        setLoading(true);
        setError("");
        const res = await getUserSegmentation();
        setData(res);
      } catch (err) {
        setError(err.message || "Failed to load ML cluster insights.");
      } finally {
        setLoading(false);
      }
    }
    fetchInsights();
  }, []);

  const formatCurrency = (val) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val || 0);

  const getClusterColor = (name) => {
    if (!name) return "#94a3b8";
    if (name.includes("Saver")) return "#34d399";
    if (name.includes("Balanced")) return "#60a5fa";
    return "#f87171";
  };

  const seg = data?.segmentation;
  const feat = data?.features;
  const clusterColor = getClusterColor(seg?.cluster_name);

  return (
    <div className="app-shell">
      <Sidebar />

      <main className="main-panel">
        <Navbar />

        <section className="dashboard-content">
          <div className="welcome-row">
            <div>
              <p className="eyebrow">MACHINE LEARNING INTELLIGENCE</p>
              <h2>Spending Segmentation (K-Means)</h2>
              <p className="muted">
                Unsupervised clustering grouping your financial patterns against standard behavioral archetypes.
              </p>
            </div>
            <Link to="/" className="secondary-btn" style={{ textDecoration: "none", alignSelf: "flex-start" }}>
              ← Back to Dashboard
            </Link>
          </div>

          {loading && (
            <div style={{ padding: "48px 0", textAlign: "center", color: "#94a3b8" }}>
              <p>Computing spending features and running K-Means model...</p>
            </div>
          )}

          {error && (
            <div className="auth-error-banner" role="alert" style={{ marginTop: "1.5rem" }}>
              <span>⚠</span> {error}
            </div>
          )}

          {!loading && data && !data.hasData && (
            <div className="panel" style={{ marginTop: "1.5rem", textAlign: "center", padding: "48px 24px" }}>
              <div style={{ fontSize: "40px", marginBottom: "12px" }}>📊</div>
              <h3>No transaction data recorded yet</h3>
              <p className="muted" style={{ marginBottom: "20px" }}>
                Add or import transactions to enable machine-learning behavioral clustering.
              </p>
              <Link to="/upload" className="primary-btn" style={{ display: "inline-block", textDecoration: "none" }}>
                Import Transaction CSV
              </Link>
            </div>
          )}

          {!loading && data && data.hasData && seg && (
            <div style={{ marginTop: "1.5rem" }}>
              {/* Engine Source Banner */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: seg.available ? "rgba(52, 211, 153, 0.1)" : "rgba(245, 158, 11, 0.1)",
                  border: seg.available ? "1px solid #34d399" : "1px solid #f59e0b",
                  borderRadius: "10px",
                  padding: "12px 18px",
                  marginBottom: "1.5rem",
                  fontSize: "13px",
                }}
              >
                <span>
                  {seg.available ? "⚡ Active Model: " : "⚠ Notice: "}
                  <strong>{seg.available ? "Python FastAPI + scikit-learn (K-Means k=3)" : seg.warning}</strong>
                </span>
                <span style={{ color: "#94a3b8", fontFamily: "monospace" }}>
                  v: {seg.model_version}
                </span>
              </div>

              {/* Cluster Headline Card */}
              <div
                className="panel"
                style={{
                  borderLeft: `5px solid ${clusterColor}`,
                  marginBottom: "1.5rem",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
                  <div>
                    <span className="eyebrow">YOUR BEHAVIORAL ARCHETYPE</span>
                    <h2 style={{ fontSize: "28px", color: clusterColor, marginTop: "4px" }}>
                      {seg.cluster_name}
                    </h2>
                  </div>
                  <span
                    style={{
                      background: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid #2d3d54",
                      padding: "6px 12px",
                      borderRadius: "20px",
                      fontSize: "12px",
                      fontWeight: "600",
                      color: clusterColor,
                    }}
                  >
                    Cluster ID: {seg.cluster_id !== undefined ? seg.cluster_id : "Assigned"}
                  </span>
                </div>

                <p style={{ fontSize: "15px", lineHeight: "1.6", marginTop: "12px", color: "#e2e8f0" }}>
                  {seg.description}
                </p>

                <div
                  style={{
                    marginTop: "16px",
                    padding: "16px",
                    background: "#131f33",
                    borderRadius: "8px",
                    border: "1px solid #202c3d",
                  }}
                >
                  <h4 style={{ color: "#f1f5fb", margin: "0 0 6px" }}>Actionable Recommendation</h4>
                  <p style={{ margin: 0, color: "#94a3b8", fontSize: "14px", lineHeight: "1.5" }}>
                    {seg.recommendation}
                  </p>
                </div>
              </div>

              {/* Engineered Feature Cards */}
              <div className="panel-heading" style={{ marginBottom: "1rem" }}>
                <div>
                  <h3>Engineered Financial Features</h3>
                  <p className="muted">Input metrics calculated from your real transactions and scaled for K-Means.</p>
                </div>
              </div>

              <div className="stats-grid" style={{ marginBottom: "1.5rem" }}>
                <article className="stat-card">
                  <span className="stat-label">AVG MONTHLY INCOME</span>
                  <p className="stat-value">{formatCurrency(feat?.monthly_income)}</p>
                  <p className="stat-note">Over {feat?.months_analyzed} active month(s)</p>
                </article>

                <article className="stat-card">
                  <span className="stat-label">AVG MONTHLY EXPENSES</span>
                  <p className="stat-value">{formatCurrency(feat?.monthly_expense)}</p>
                  <p className="stat-note">Essential and discretionary</p>
                </article>

                <article className="stat-card">
                  <span className="stat-label">SAVINGS RATE</span>
                  <p
                    className="stat-value"
                    style={{ color: (feat?.savings_rate || 0) >= 20 ? "#34d399" : "#f87171" }}
                  >
                    {feat?.savings_rate?.toFixed(1)}%
                  </p>
                  <p className="stat-note">Net surplus / total income</p>
                </article>

                <article className="stat-card">
                  <span className="stat-label">EXPENSE RATIO</span>
                  <p className="stat-value">{feat?.expense_ratio?.toFixed(1)}%</p>
                  <p className="stat-note">Share of income spent</p>
                </article>
              </div>

              {/* Educational Explainability Box */}
              <div className="panel" style={{ marginTop: "1.5rem" }}>
                <div className="insight-symbol">✦</div>
                <div>
                  <h4 style={{ color: "#f1f5fb", marginBottom: "6px" }}>How Does FinSight AI Compute This?</h4>
                  <p className="muted" style={{ fontSize: "13px", lineHeight: "1.6" }}>
                    We scale your income, expenses, and savings rates using <code>StandardScaler</code> (z-score normalization: 
                    <code>(x - mean) / std</code>) so that high-rupee amounts do not overwhelm percentage rates. The scaled 
                    vector is fed into an unsupervised <strong>K-Means model (k=3)</strong> trained on hundreds of representative 
                    spending profiles to identify your closest behavioral cluster centroid via Euclidean distance.
                  </p>
                </div>
              </div>

              <footer className="dashboard-footer" style={{ marginTop: "2rem" }}>
                FinSight AI · Machine Learning Intelligence Layer
                <span>Unsupervised behavioral grouping — illustrative estimate, not certified financial advice.</span>
              </footer>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default ClusterInsights;
