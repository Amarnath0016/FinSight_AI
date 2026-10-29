import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../hooks/useTheme";

function Navbar() {
  const { user, logout } = useAuth();
  const { toggleTheme, isDark } = useTheme();

  const initial = user?.name ? user.name[0].toUpperCase() : "U";

  return (
    <header className="navbar">
      <div>
        <p className="eyebrow">PERSONAL FINANCE INTELLIGENCE</p>
        <h1>FinSight AI</h1>
      </div>

      <div className="navbar-right" style={{ display: "flex", alignItems: "center", gap: "14px" }}>
        <button
          type="button"
          onClick={toggleTheme}
          className="theme-toggle-btn"
          title={`Switch to ${isDark ? "Light" : "Dark"} Mode`}
          aria-label={`Switch to ${isDark ? "Light" : "Dark"} Mode`}
        >
          <span className="theme-toggle-icon" aria-hidden="true">
            {isDark ? "☀️" : "🌙"}
          </span>
          <span className="theme-toggle-text">
            {isDark ? "Light Mode" : "Dark Mode"}
          </span>
        </button>

        <span className="status-dot" />
        <span style={{ fontSize: "13px", fontWeight: "500" }}>
          {user?.name || "Demo workspace"}
        </span>
        <div className="avatar" title={user?.email || ""}>
          {initial}
        </div>
        <button
          type="button"
          onClick={logout}
          className="logout-btn"
          title="Sign out of FinSight AI"
        >
          Sign Out
        </button>
      </div>
    </header>
  );
}

export default Navbar;
