import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please enter both email and password.");
      return;
    }

    try {
      setLoading(true);
      await login(email.trim(), password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message || "Failed to log in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  }

  function handleDemoFill() {
    setEmail("demo@finsight.ai");
    setPassword("Password123!");
    setError("");
  }

  return (
    <div className="auth-shell">
      <div className="auth-container">
        <div className="brand" style={{ justifyContent: "center", marginBottom: "1.5rem" }}>
          <div className="brand-mark">F</div>
          <div>
            <strong>FinSight</strong>
            <span>FINANCIAL INTELLIGENCE</span>
          </div>
        </div>

        <div className="auth-card">
          <h2>Welcome back</h2>
          <p className="muted" style={{ marginBottom: "1.5rem" }}>
            Log in to view your spending insights and financial health.
          </p>

          {error && (
            <div className="auth-error-banner" role="alert">
              <span>⚠</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <label>
              Email address
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                required
                autoComplete="email"
              />
            </label>

            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </label>

            <button type="submit" className="primary-btn" disabled={loading}>
              {loading ? "Logging in..." : "Log In"}
            </button>
          </form>

          <div className="demo-login-box">
            <p className="muted" style={{ fontSize: "0.85rem", marginBottom: "0.5rem" }}>
              Evaluating FinSight AI? Use the seeded demo profile:
            </p>
            <button
              type="button"
              className="secondary-btn"
              onClick={handleDemoFill}
            >
              Fill Demo Credentials
            </button>
          </div>

          <div className="auth-footer-link">
            <span>Don't have an account? </span>
            <Link to="/register">Create an account</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
