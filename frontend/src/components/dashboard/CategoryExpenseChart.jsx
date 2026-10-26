
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);

function CategoryExpenseChart({ data = [] }) {
  const highestCategory = data[0];

  if (data.length === 0) {
    return (
      <section className="panel category-panel">
        <h3>Spending by category</h3>
        <p className="muted">
          No expense transactions are available for this selection.
        </p>
      </section>
    );
  }

  return (
    <section className="panel category-panel">
      <div className="panel-heading">
        <div>
          <h3>Spending by category</h3>
          <p className="muted">
            Expense totals and each category's share of spending.
          </p>
        </div>
      </div>

      <div className="highest-category">
        <span className="muted">Highest-spending category</span>
        <strong>{highestCategory.category}</strong>
        <span>{formatCurrency(highestCategory.amount)}</span>
      </div>

      <div className="category-chart">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
          >
            <CartesianGrid
              stroke="#263347"
              strokeDasharray="3 3"
              horizontal={false}
            />
            <XAxis
              type="number"
              tick={{ fill: "#95a3b8", fontSize: 11 }}
              tickFormatter={(value) => `₹${value}`}
            />
            <YAxis
              type="category"
              dataKey="category"
              width={105}
              tick={{ fill: "#cbd5e1", fontSize: 11 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#111c2d",
                border: "1px solid #34445c",
                borderRadius: "10px",
                color: "#f1f5fb",
              }}
              formatter={(value, name, item) => [
                `${formatCurrency(value)} (${item.payload.percentage.toFixed(2)}%)`,
                "Expenses",
              ]}
            />
            <Bar
              dataKey="amount"
              name="Expenses"
              fill="#5ee7b1"
              radius={[0, 5, 5, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="category-breakdown">
        {data.map((item) => (
          <div className="category-row" key={item.category}>
            <div className="category-row-heading">
              <span>{item.category}</span>
              <strong>{formatCurrency(item.amount)}</strong>
            </div>

            <div
              className="category-progress-track"
              aria-label={`${item.category}: ${item.percentage.toFixed(2)}% of expenses`}
            >
              <div
                className="category-progress-fill"
                style={{ width: `${item.percentage}%` }}
              />
            </div>

            <span className="muted">
              {item.percentage.toFixed(2)}% of expenses
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default CategoryExpenseChart;
