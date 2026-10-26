
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

function ExpenseChart({ transactions = [] }) {
  const income = transactions
    .filter((item) => item.type === "income")
    .reduce((sum, item) => sum + Number(item.amount), 0);

  const expenses = transactions
    .filter((item) => item.type === "expense")
    .reduce((sum, item) => sum + Number(item.amount), 0);

  const data = [
    {
      name: "All recorded transactions",
      Income: income,
      Expenses: expenses,
    },
  ];

  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);

  return (
    <div style={{ width: "100%", height: 300 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis tickFormatter={(value) => `₹${value}`} />
          <Tooltip
  contentStyle={{
    backgroundColor: "#111c2d",
    border: "1px solid #34445c",
    borderRadius: "10px",
    color: "#f1f5fb",
  }}
  labelStyle={{ color: "#e7edf7" }}
  itemStyle={{ color: "#e7edf7" }}
  formatter={(value) => formatCurrency(value)}
/>
          <Legend />
          <Bar dataKey="Income" fill="#22c55e" radius={[5, 5, 0, 0]} />
          <Bar dataKey="Expenses" fill="#ef4444" radius={[5, 5, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default ExpenseChart;
