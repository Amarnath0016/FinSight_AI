
const menuItems = [
  { icon: "▦", label: "Dashboard", active: true },
  { icon: "↕", label: "Transactions" },
  { icon: "◷", label: "Analytics" },
  { icon: "✧", label: "AI Insights" },
];

function Sidebar() {
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
        {menuItems.map((item) => (
          <button
            className={`nav-item ${item.active ? "active" : ""}`}
            key={item.label}
            type="button"
          >
            <span className="nav-icon" aria-hidden="true">
              {item.icon}
            </span>
            {item.label}
          </button>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <div className="privacy-icon">✓</div>
        <strong>Privacy first</strong>
        <p>Your financial data should remain private and secure.</p>
        <span className="version">FINSIGHT AI · WEEK 5</span>
      </div>
    </aside>
  );
}

export default Sidebar;
