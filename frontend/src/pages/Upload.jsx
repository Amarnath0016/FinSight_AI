import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";
import { previewCsvUpload, commitCsvUpload } from "../services/api";

function Upload() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [commitLoading, setCommitLoading] = useState(false);
  const [error, setError] = useState("");
  const [previewData, setPreviewData] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  const navigate = useNavigate();

  function handleFileChange(event) {
    const file = event.target.files?.[0];
    if (file) {
      selectFile(file);
    }
  }

  function selectFile(file) {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Please select a valid CSV file (.csv).");
      return;
    }
    setError("");
    setSelectedFile(file);
    setPreviewData(null);
    setSuccessMessage("");
  }

  function handleDragOver(e) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave() {
    setIsDragging(false);
  }

  function handleDrop(e) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      selectFile(file);
    }
  }

  async function handlePreview(e) {
    e.preventDefault();
    if (!selectedFile) return;

    setError("");
    setPreviewLoading(true);

    try {
      const data = await previewCsvUpload(selectedFile);
      setPreviewData(data);
    } catch (err) {
      setError(err.message || "Failed to preview CSV file.");
    } finally {
      setPreviewLoading(false);
    }
  }

  async function handleCommit() {
    if (!previewData || previewData.validTransactions.length === 0) return;

    setError("");
    setCommitLoading(true);

    try {
      const res = await commitCsvUpload(previewData.validTransactions);
      setSuccessMessage(res.message || "Transactions imported successfully!");
      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch (err) {
      setError(err.message || "Failed to import transactions.");
      setCommitLoading(false);
    }
  }

  function resetUpload() {
    setSelectedFile(null);
    setPreviewData(null);
    setError("");
    setSuccessMessage("");
  }

  const formatCurrency = (val) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(val);

  return (
    <div className="app-shell">
      <Sidebar />

      <main className="main-panel">
        <Navbar />

        <section className="dashboard-content">
          <div className="welcome-row">
            <div>
              <p className="eyebrow">DATA INGESTION PIPELINE</p>
              <h2>Import Transactions</h2>
              <p className="muted">
                Upload your CSV transaction statement. Preview and validate records safely before saving to your database.
              </p>
            </div>
            <Link to="/" className="secondary-btn" style={{ textDecoration: "none", alignSelf: "flex-start" }}>
              ← Back to Dashboard
            </Link>
          </div>

          {error && (
            <div className="auth-error-banner" role="alert" style={{ marginTop: "1rem" }}>
              <span>⚠</span> {error}
            </div>
          )}

          {successMessage && (
            <div
              style={{
                background: "rgba(34, 197, 94, 0.15)",
                border: "1px solid #22c55e",
                color: "#86efac",
                padding: "12px 18px",
                borderRadius: "8px",
                marginTop: "1rem",
                fontWeight: "600",
              }}
              role="status"
            >
              ✓ {successMessage} Redirecting to your dashboard...
            </div>
          )}

          {/* Upload Area */}
          {!previewData && (
            <div className="panel" style={{ marginTop: "1.5rem" }}>
              <div
                className={`dropzone-area ${isDragging ? "dropzone-active" : ""}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                style={{
                  border: isDragging ? "2px dashed #34d399" : "2px dashed #2d3d54",
                  borderRadius: "12px",
                  padding: "48px 24px",
                  textAlign: "center",
                  background: isDragging ? "rgba(52, 211, 153, 0.05)" : "#0e1727",
                  transition: "all 0.2s",
                }}
              >
                <div style={{ fontSize: "36px", marginBottom: "12px" }}>📄</div>
                <h3 style={{ marginBottom: "6px" }}>Drag and drop your transaction CSV here</h3>
                <p className="muted" style={{ marginBottom: "18px" }}>
                  Supports CSV files up to 5MB with columns: Date, Title, Amount, Type, Category
                </p>

                <input
                  type="file"
                  id="csv-file-input"
                  accept=".csv"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />

                <label
                  htmlFor="csv-file-input"
                  className="secondary-btn"
                  style={{ cursor: "pointer", display: "inline-block" }}
                >
                  Browse Files
                </label>

                {selectedFile && (
                  <div
                    style={{
                      marginTop: "20px",
                      padding: "12px 16px",
                      background: "#131f33",
                      borderRadius: "8px",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <span>✓ <strong>{selectedFile.name}</strong> ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                    <button
                      type="button"
                      onClick={handlePreview}
                      className="primary-btn"
                      disabled={previewLoading}
                      style={{ padding: "6px 16px", marginTop: 0 }}
                    >
                      {previewLoading ? "Parsing & Validating..." : "Inspect & Preview"}
                    </button>
                  </div>
                )}
              </div>

              {/* CSV Format Reference */}
              <div style={{ marginTop: "2rem" }}>
                <h4 style={{ marginBottom: "8px", color: "#f1f5fb" }}>Expected CSV Format Guide</h4>
                <p className="muted" style={{ fontSize: "13px", marginBottom: "12px" }}>
                  FinSight AI automatically detects column headers. Below is an example structure:
                </p>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", background: "#131f33", borderRadius: "8px" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid #202c3d", color: "#94a3b8", textAlign: "left" }}>
                        <th style={{ padding: "10px" }}>Date</th>
                        <th style={{ padding: "10px" }}>Title / Description</th>
                        <th style={{ padding: "10px" }}>Amount</th>
                        <th style={{ padding: "10px" }}>Type</th>
                        <th style={{ padding: "10px" }}>Category</th>
                      </tr>
                    </thead>
                    <tbody style={{ color: "#cbd5e1" }}>
                      <tr style={{ borderBottom: "1px solid #1a2638" }}>
                        <td style={{ padding: "10px" }}>2026-10-01</td>
                        <td style={{ padding: "10px" }}>Monthly Salary</td>
                        <td style={{ padding: "10px" }}>65000</td>
                        <td style={{ padding: "10px" }}>income</td>
                        <td style={{ padding: "10px" }}>Salary</td>
                      </tr>
                      <tr>
                        <td style={{ padding: "10px" }}>2026-10-05</td>
                        <td style={{ padding: "10px" }}>Supermarket Provisions</td>
                        <td style={{ padding: "10px" }}>3200</td>
                        <td style={{ padding: "10px" }}>expense</td>
                        <td style={{ padding: "10px" }}>Food</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Preview Results Area */}
          {previewData && (
            <div style={{ marginTop: "1.5rem" }}>
              {/* Summary Stats */}
              <div className="stats-grid" style={{ marginBottom: "1.5rem" }}>
                <article className="stat-card">
                  <span className="stat-label">TOTAL ROWS PARSED</span>
                  <p className="stat-value">{previewData.summary.totalRows}</p>
                  <p className="stat-note">From {previewData.filename}</p>
                </article>

                <article className="stat-card">
                  <span className="stat-label">VALID RECORDS</span>
                  <p className="stat-value" style={{ color: "#34d399" }}>
                    {previewData.summary.validCount}
                  </p>
                  <p className="stat-note">Ready to import safely</p>
                </article>

                <article className="stat-card">
                  <span className="stat-label">REJECTED ROWS</span>
                  <p className="stat-value" style={{ color: previewData.summary.invalidCount > 0 ? "#ef4444" : "#94a3b8" }}>
                    {previewData.summary.invalidCount}
                  </p>
                  <p className="stat-note">Formatting or validation errors</p>
                </article>

                <article className="stat-card">
                  <span className="stat-label">DUPLICATES</span>
                  <p className="stat-value" style={{ color: previewData.summary.duplicateCount > 0 ? "#f59e0b" : "#94a3b8" }}>
                    {previewData.summary.duplicateCount}
                  </p>
                  <p className="stat-note">Duplicate rows skipped</p>
                </article>
              </div>

              {/* Action Bar */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "#0e1727",
                  border: "1px solid #202c3d",
                  borderRadius: "10px",
                  padding: "16px 20px",
                  marginBottom: "1.5rem",
                }}
              >
                <div>
                  <h3 style={{ margin: 0, fontSize: "16px" }}>
                    Ready to import {previewData.validTransactions.length} valid transactions?
                  </h3>
                  <p className="muted" style={{ margin: "4px 0 0", fontSize: "13px" }}>
                    Invalid rows will be skipped automatically. No corrupted data will be stored.
                  </p>
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    type="button"
                    onClick={resetUpload}
                    className="secondary-btn"
                    disabled={commitLoading}
                  >
                    Cancel / Pick Another File
                  </button>
                  <button
                    type="button"
                    onClick={handleCommit}
                    className="primary-btn"
                    disabled={commitLoading || previewData.validTransactions.length === 0}
                    style={{ marginTop: 0, padding: "8px 20px" }}
                  >
                    {commitLoading ? "Importing..." : `Import ${previewData.validTransactions.length} Transactions`}
                  </button>
                </div>
              </div>

              {/* Valid Transactions Table */}
              <div className="panel" style={{ marginBottom: "1.5rem" }}>
                <h3>Valid Transactions ({previewData.validTransactions.length})</h3>
                <p className="muted" style={{ marginBottom: "1rem" }}>
                  These records passed all validation checks and will be persisted.
                </p>

                {previewData.validTransactions.length === 0 ? (
                  <p className="muted">No valid rows found in this file.</p>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid #202c3d", color: "#94a3b8", textAlign: "left" }}>
                          <th style={{ padding: "10px" }}>Date</th>
                          <th style={{ padding: "10px" }}>Title</th>
                          <th style={{ padding: "10px" }}>Category</th>
                          <th style={{ padding: "10px" }}>Type</th>
                          <th style={{ padding: "10px", textAlign: "right" }}>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.validTransactions.map((tx, idx) => (
                          <tr key={idx} style={{ borderBottom: "1px solid #1a2638" }}>
                            <td style={{ padding: "10px" }}>{tx.date}</td>
                            <td style={{ padding: "10px", fontWeight: "600", color: "#f1f5fb" }}>{tx.title}</td>
                            <td style={{ padding: "10px" }}>{tx.category}</td>
                            <td style={{ padding: "10px" }}>
                              <span
                                style={{
                                  display: "inline-block",
                                  padding: "2px 8px",
                                  borderRadius: "4px",
                                  fontSize: "11px",
                                  fontWeight: "700",
                                  background: tx.type === "income" ? "rgba(34, 197, 94, 0.2)" : "rgba(239, 68, 68, 0.2)",
                                  color: tx.type === "income" ? "#4ade80" : "#f87171",
                                }}
                              >
                                {tx.type.toUpperCase()}
                              </span>
                            </td>
                            <td
                              style={{
                                padding: "10px",
                                textAlign: "right",
                                fontWeight: "700",
                                color: tx.type === "income" ? "#4ade80" : "#f87171",
                              }}
                            >
                              {tx.type === "income" ? "+" : "-"}
                              {formatCurrency(tx.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Invalid Rows Table */}
              {previewData.invalidRows.length > 0 && (
                <div className="panel" style={{ borderColor: "#ef4444" }}>
                  <h3 style={{ color: "#f87171" }}>
                    Rejected Rows ({previewData.invalidRows.length})
                  </h3>
                  <p className="muted" style={{ marginBottom: "1rem" }}>
                    These rows could not be parsed and will be skipped. Review the reasons below to fix your CSV file if needed.
                  </p>

                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid #3d2020", color: "#fca5a5", textAlign: "left" }}>
                          <th style={{ padding: "10px", width: "80px" }}>Row #</th>
                          <th style={{ padding: "10px" }}>Data in Row</th>
                          <th style={{ padding: "10px" }}>Reason for Rejection</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.invalidRows.map((inv, idx) => (
                          <tr key={idx} style={{ borderBottom: "1px solid #2a1515" }}>
                            <td style={{ padding: "10px", fontWeight: "700", color: "#f87171" }}>
                              Line {inv.rowNumber}
                            </td>
                            <td style={{ padding: "10px", color: "#94a3b8", fontFamily: "monospace" }}>
                              {JSON.stringify(inv.data)}
                            </td>
                            <td style={{ padding: "10px", color: "#fca5a5" }}>
                              {inv.reasons.join("; ")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default Upload;
