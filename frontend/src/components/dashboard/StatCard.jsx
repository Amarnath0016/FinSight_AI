
function StatCard({ label, value, note, icon, tone }) {
  return (
    <article className="stat-card">
      <div className="stat-card-top">
        <span className="stat-label">{label}</span>
        <span className={`stat-icon ${tone}`} aria-hidden="true">
          {icon}
        </span>
      </div>

      <p className="stat-value">{value}</p>
      <p className="stat-note">{note}</p>
    </article>
  );
}

export default StatCard;
