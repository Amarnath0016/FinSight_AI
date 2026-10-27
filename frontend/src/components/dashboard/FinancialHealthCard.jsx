
function FinancialHealthCard({ result }) {
  const hasScore = result.score !== null;

  const scoreAngle = hasScore
    ? `${result.score * 3.6}deg`
    : "0deg";

  return (
    <section
      className="panel health-panel"
      aria-labelledby="financial-health-heading"
    >
      <div className="panel-heading">
        <div>
          <p className="eyebrow">WEEK 4 · FINANCIAL WELLNESS</p>
          <h3 id="financial-health-heading">
            Financial Health Score
          </h3>
          <p className="muted">
            An explainable estimate based on recorded income and expenses.
          </p>
        </div>

        <span className="health-label">{result.label}</span>
      </div>

      <div className="health-overview">
        <div
          className={`health-score-ring ${
            hasScore ? "" : "health-score-unavailable"
          }`}
          style={{ "--score-angle": scoreAngle }}
          role={hasScore ? "img" : undefined}
          aria-label={
            hasScore
              ? `Financial health score: ${result.score} out of 100`
              : undefined
          }
        >
          <div className="health-score-inner">
            <strong>{hasScore ? result.score : "—"}</strong>
            <span>out of 100</span>
          </div>
        </div>

        <div className="health-summary">
          <h4>
            {hasScore
              ? "What does your score mean?"
              : "More data is needed"}
          </h4>

          <p className="muted">
            {hasScore
              ? "This score summarizes your recorded savings rate and expense-to-income ratio. It is not a complete measure of your financial situation."
              : "Record valid income transactions to calculate your savings rate and expense-to-income ratio."}
          </p>

          <p className="health-data-note">
            Based on {result.transactionCount} valid transaction
            {result.transactionCount === 1 ? "" : "s"}.
          </p>
        </div>
      </div>

      {hasScore && (
        <div className="health-breakdown">
          <h4>How the score is calculated</h4>

          {result.breakdown.map((item) => (
            <div className="health-factor" key={item.key}>
              <div className="health-factor-heading">
                <span>{item.label}</span>
                <strong>
                  {item.points}/{item.maxPoints} points
                </strong>
              </div>

              <div
                className="health-progress-track"
                role="progressbar"
                aria-label={item.label}
                aria-valuemin={0}
                aria-valuemax={item.maxPoints}
                aria-valuenow={item.points}
              >
                <div
                  className="health-progress-fill"
                  style={{
                    width: `${
                      (item.points / item.maxPoints) * 100
                    }%`,
                  }}
                />
              </div>

              <p className="muted">
                {item.value} · {item.explanation}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="health-insights">
        <h4>Financial insights</h4>

        {result.insights.map((insight, index) => (
          <article
            className={`health-insight ${insight.type}`}
            key={`${insight.title}-${index}`}
          >
            <strong>{insight.title}</strong>
            <p>{insight.message}</p>
          </article>
        ))}
      </div>

      <p className="health-disclaimer">
        Educational estimate only. This score uses recorded transactions
        and does not evaluate assets, debts, emergency savings, or
        unrecorded expenses. It is not professional financial advice.
      </p>
    </section>
  );
}

export default FinancialHealthCard;
