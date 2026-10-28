import { Link, useLocation } from "react-router-dom";

function Sidebar() {
  const location = useLocation();

  const navItems = [
    { path: "/", icon: "▦", label: "Dashboard" },
    { path: "/clusters", icon: "✦", label: "Cluster Insights" },
    { path: "/upload", icon: "⇪", label: "CSV Upload" },
  ];

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">F</div>
        <div>
          <strong>FinSight</strong>
          <span>FINANCIAL INTELLIGENCE</span>
        </div>
      </div>

      <p className="sidebar-label">WORKSPACE</p>

      <nav className="sidebar-nav" aria-label="Main navigation">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              to={item.path}
              key={item.path}
              className={`nav-item ${isActive ? "active" : ""}`}
              style={{ textDecoration: "none" }}
            >
              <span className="nav-icon" aria-hidden="true">
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-bottom">
        <div className="privacy-icon">✓</div>
        <strong>Privacy first</strong>
        <p>Your financial data remains strictly user-isolated.</p>
        <span className="version">FINSIGHT AI · ML SERVICE</span>
      </div>
    </aside>
  );
}

export default Sidebar;
