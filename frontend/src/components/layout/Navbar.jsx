import { useAuth } from "../../hooks/useAuth";

function Navbar() {
  const { user, logout } = useAuth();

  const initial = user?.name ? user.name[0].toUpperCase() : "U";

  return (
    <header className="navbar">
      <div>
        <p className="eyebrow">PERSONAL FINANCE INTELLIGENCE</p>
        <h1>FinSight AI</h1>
      </div>

      <div className="navbar-right" style={{ display: "flex", alignItems: "center", gap: "14px" }}>
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
