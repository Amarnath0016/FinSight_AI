import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";
import {
  sendCopilotMessage,
  getCopilotHistory,
  clearCopilotHistory,
} from "../services/api";

const SUGGESTED_QUESTIONS = [
  "What is my financial health score and how can I improve it?",
  "Where did my money go? Show top spending categories.",
  "What is my savings rate and cash flow surplus?",
  "What if I simulate cutting my expenses by 20%?",
  "Explain the 50/30/20 budgeting rule.",
  "Do I have any mutual fund or stock investments recorded?",
];

function formatMessageContent(content) {
  // Simple markdown renderer for headers, bold, bullets, and linebreaks
  return content.split("\n").map((line, idx) => {
    if (line.startsWith("### ")) {
      return (
        <h4 key={idx} style={{ color: "#34d399", margin: "12px 0 6px" }}>
          {line.replace("### ", "")}
        </h4>
      );
    }
    if (line.startsWith("• ") || line.startsWith("- ")) {
      return (
        <li key={idx} style={{ marginLeft: "18px", marginBottom: "4px" }}>
          {renderFormattedText(line.replace(/^[•-]\s+/, ""))}
        </li>
      );
    }
    if (/^\d+\.\s+/.test(line)) {
      return (
        <li key={idx} style={{ marginLeft: "18px", marginBottom: "4px" }}>
          {renderFormattedText(line.replace(/^\d+\.\s+/, ""))}
        </li>
      );
    }
    if (line.trim() === "") {
      return <div key={idx} style={{ height: "8px" }} />;
    }
    return (
      <p key={idx} style={{ margin: "4px 0" }}>
        {renderFormattedText(line)}
      </p>
    );
  });
}

function renderFormattedText(text) {
  // Parse **bold** parts
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} style={{ color: "#f1f5fb" }}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

function Copilot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);
  const location = useLocation();
  const initialPromptProcessed = useRef(false);

  useEffect(() => {
    async function loadHistory() {
      try {
        setHistoryLoading(true);
        const history = await getCopilotHistory();
        if (history && history.length > 0) {
          setMessages(history);
        } else {
          // Initial greeting if no history
          setMessages([
            {
              role: "assistant",
              content:
                "Hello! I am your **FinSight AI Copilot**.\n\n" +
                "I am directly grounded on your recorded MongoDB transactions. You can ask me to explain your **Health Score**, break down your **Spending Categories**, check your **Savings Rate**, or explain general budgeting rules like **50/30/20**.\n\n" +
                "Click one of the suggested prompts below or type your question!",
              source: "system",
              timestamp: new Date(),
            },
          ]);
        }
      } catch (err) {
        console.warn("Failed to load history:", err.message);
      } finally {
        setHistoryLoading(false);
      }
    }
    loadHistory();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = useCallback(async (promptText) => {
    const textToSend = (promptText || input).trim();
    if (!textToSend || loading) return;

    setError("");
    setInput("");

    const userMessage = {
      role: "user",
      content: textToSend,
      source: "user_data",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const res = await sendCopilotMessage(textToSend);
      if (res?.message) {
        setMessages((prev) => [...prev, res.message]);
      }
    } catch (err) {
      setError(err.message || "Failed to get response from Copilot.");
    } finally {
      setLoading(false);
    }
  }, [input, loading]);

  useEffect(() => {
    if (location.state?.initialPrompt && !initialPromptProcessed.current && !historyLoading) {
      initialPromptProcessed.current = true;
      handleSend(location.state.initialPrompt);
    }
  }, [location.state, historyLoading, handleSend]);

  async function handleClearHistory() {
    if (!window.confirm("Are you sure you want to clear your Copilot chat history?")) return;
    try {
      await clearCopilotHistory();
      setMessages([
        {
          role: "assistant",
          content: "Conversation history cleared. How can I help you analyze your finances today?",
          source: "system",
          timestamp: new Date(),
        },
      ]);
    } catch (err) {
      setError(err.message || "Failed to clear history.");
    }
  }

  const getSourceBadge = (source) => {
    if (source === "user_data") {
      return (
        <span
          style={{
            fontSize: "11px",
            padding: "2px 8px",
            borderRadius: "12px",
            background: "rgba(52, 211, 153, 0.15)",
            color: "#34d399",
            fontWeight: "600",
            border: "1px solid rgba(52, 211, 153, 0.3)",
          }}
        >
          ✓ Grounded in your data
        </span>
      );
    }
    if (source === "general_education") {
      return (
        <span
          style={{
            fontSize: "11px",
            padding: "2px 8px",
            borderRadius: "12px",
            background: "rgba(96, 165, 250, 0.15)",
            color: "#60a5fa",
            fontWeight: "600",
            border: "1px solid rgba(96, 165, 250, 0.3)",
          }}
        >
          📖 Financial Education (RAG)
        </span>
      );
    }
    return (
      <span
        style={{
          fontSize: "11px",
          padding: "2px 8px",
          borderRadius: "12px",
          background: "rgba(148, 163, 184, 0.15)",
          color: "#94a3b8",
          fontWeight: "600",
        }}
      >
        ✧ FinSight System
      </span>
    );
  };

  return (
    <div className="app-shell">
      <Sidebar />

      <main className="main-panel">
        <Navbar />

        <section className="dashboard-content" style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 110px)" }}>
          <div className="welcome-row" style={{ flexShrink: 0, marginBottom: "1rem" }}>
            <div>
              <p className="eyebrow">GROUNDED FINANCIAL COPILOT</p>
              <h2>AI Financial Intelligence</h2>
              <p className="muted">
                Ask questions about your transactions, spending habits, and health score with zero hallucinations.
              </p>
            </div>

            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <button
                type="button"
                onClick={handleClearHistory}
                className="secondary-btn"
                style={{ fontSize: "12px", padding: "6px 12px" }}
              >
                Clear History
              </button>
              <Link to="/" className="secondary-btn" style={{ textDecoration: "none", fontSize: "12px", padding: "6px 12px" }}>
                ← Dashboard
              </Link>
            </div>
          </div>

          {error && (
            <div className="auth-error-banner" role="alert" style={{ flexShrink: 0 }}>
              <span>⚠</span> {error}
            </div>
          )}

          {/* Chat Container */}
          <div
            className="panel"
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              padding: "0",
              overflow: "hidden",
              background: "#0e1727",
            }}
          >
            {/* Messages Scroll Area */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "20px 24px",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              {historyLoading ? (
                <div style={{ textAlign: "center", color: "#94a3b8", padding: "30px 0" }}>
                  Loading conversation...
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isUser = msg.role === "user";
                  return (
                    <div
                      key={index}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: isUser ? "flex-end" : "flex-start",
                        maxWidth: "85%",
                        alignSelf: isUser ? "flex-end" : "flex-start",
                      }}
                    >
                      <div
                        style={{
                          background: isUser ? "#1e293b" : "#131f33",
                          border: isUser ? "1px solid #334155" : "1px solid #202c3d",
                          borderRadius: isUser ? "16px 16px 2px 16px" : "16px 16px 16px 2px",
                          padding: "14px 18px",
                          color: "#e2e8f0",
                          fontSize: "14px",
                          lineHeight: "1.6",
                          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
                        }}
                      >
                        {!isUser && (
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", gap: "12px" }}>
                            <span style={{ fontSize: "12px", fontWeight: "700", color: "#34d399" }}>
                              FinSight Copilot
                            </span>
                            {getSourceBadge(msg.source)}
                          </div>
                        )}
                        <div>{formatMessageContent(msg.content)}</div>
                      </div>

                      <span style={{ fontSize: "10px", color: "#64748b", marginTop: "4px", padding: "0 4px" }}>
                        {msg.timestamp
                          ? new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                          : ""}
                      </span>
                    </div>
                  );
                })
              )}

              {loading && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#94a3b8", padding: "8px 0" }}>
                  <div className="status-dot" style={{ animation: "pulse 1s infinite" }} />
                  <span style={{ fontSize: "13px" }}>Analyzing your financial context...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggested Questions */}
            <div
              style={{
                padding: "10px 20px",
                background: "#0b121e",
                borderTop: "1px solid #1a2638",
                display: "flex",
                gap: "8px",
                overflowX: "auto",
                whiteSpace: "nowrap",
              }}
            >
              {SUGGESTED_QUESTIONS.map((q, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSend(q)}
                  disabled={loading}
                  style={{
                    background: "#131f33",
                    border: "1px solid #202c3d",
                    color: "#94a3b8",
                    padding: "6px 12px",
                    borderRadius: "16px",
                    fontSize: "12px",
                    cursor: "pointer",
                    flexShrink: 0,
                    transition: "all 0.2s",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.color = "#34d399";
                    e.currentTarget.style.borderColor = "#34d399";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.color = "#94a3b8";
                    e.currentTarget.style.borderColor = "#202c3d";
                  }}
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              style={{
                display: "flex",
                gap: "10px",
                padding: "16px 20px",
                background: "#0e1727",
                borderTop: "1px solid #202c3d",
              }}
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value.slice(0, 500))}
                placeholder="Ask about your health score, top spending, or budgeting rules..."
                disabled={loading}
                style={{
                  flex: 1,
                  background: "#131f33",
                  border: "1px solid #26364d",
                  borderRadius: "8px",
                  padding: "12px 16px",
                  color: "#f1f5fb",
                  fontSize: "14px",
                  outline: "none",
                }}
              />
              <button
                type="submit"
                className="primary-btn"
                disabled={loading || !input.trim()}
                style={{ padding: "0 24px", marginTop: 0 }}
              >
                {loading ? "..." : "Send"}
              </button>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Copilot;
