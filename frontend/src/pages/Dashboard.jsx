
import { useEffect, useState } from "react";

import {
  checkBackendHealth,
  getTransactions,
  updateTransaction,
  deleteTransaction,
} from "../services/api";

import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";
import StatCard from "../components/dashboard/StatCard";
import ExpenseChart from "../components/dashboard/ExpenseChart";
import AddTransactionForm from "../components/dashboard/AddTransactionForm";

const emptyForm = {
  title: "",
  amount: "",
  type: "expense",
  category: "",
  date: new Date().toLocaleDateString("en-CA"),
};

function Dashboard() {
  const [backendStatus, setBackendStatus] = useState("Checking...");
  const [backendError, setBackendError] = useState("");

  const [transactions, setTransactions] = useState([]);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [transactionsError, setTransactionsError] = useState("");
  const [actionError, setActionError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    checkBackendHealth()
      .then((data) => {
        setBackendStatus(
          data.success || data.status === "online"
            ? "Connected"
            : "Unavailable"
        );
      })
      .catch(() => {
        setBackendStatus("Unavailable");
        setBackendError("Could not connect to the backend.");
      });
  }, []);

  async function loadTransactions() {
    setTransactionsLoading(true);
    setTransactionsError("");

    try {
      const data = await getTransactions();
      setTransactions(Array.isArray(data) ? data : []);
    } catch (error) {
      setTransactionsError(
        error.message || "Could not load transactions."
      );
    } finally {
      setTransactionsLoading(false);
    }
  }

  useEffect(() => {
    loadTransactions();
  }, []);

  const totalIncome = transactions
    .filter((item) => item.type === "income")
    .reduce((sum, item) => sum + Number(item.amount), 0);

  const totalExpenses = transactions
    .filter((item) => item.type === "expense")
    .reduce((sum, item) => sum + Number(item.amount), 0);

  const netSavings = totalIncome - totalExpenses;
  const savingsRate =
    totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount);

  const dashboardStats = [
    {
      label: "TOTAL INCOME",
      value: formatCurrency(totalIncome),
      note: "Based on recorded transactions",
      icon: "↗",
      tone: "green",
    },
    {
      label: "TOTAL EXPENSES",
      value: formatCurrency(totalExpenses),
      note: "Based on recorded transactions",
      icon: "↘",
      tone: "red",
    },
    {
      label: "NET SAVINGS",
      value: formatCurrency(netSavings),
      note: "Income minus expenses",
      icon: "₹",
      tone: "blue",
    },
    {
      label: "SAVINGS RATE",
      value: `${savingsRate.toFixed(2)}%`,
      note: "Savings as a percentage of income",
      icon: "%",
      tone: "purple",
    },
  ];

  function startEditing(transaction) {
    setActionError("");
    setEditingId(transaction._id);
    setEditForm({
      title: transaction.title,
      amount: String(transaction.amount),
      type: transaction.type,
      category: transaction.category,
      date: transaction.date,
    });
  }

  async function saveEdit(event) {
    event.preventDefault();
    setActionError("");

    if (
      !editForm.title.trim() ||
      !editForm.category.trim() ||
      !editForm.date ||
      !Number.isFinite(Number(editForm.amount)) ||
      Number(editForm.amount) <= 0
    ) {
      setActionError("Enter a valid title, amount, category and date.");
      return;
    }

    try {
      setSavingEdit(true);

      await updateTransaction(editingId, {
        ...editForm,
        title: editForm.title.trim(),
        category: editForm.category.trim(),
        amount: Number(editForm.amount),
      });

      setEditingId(null);
      await loadTransactions();
    } catch (error) {
      setActionError(error.message || "Could not update transaction.");
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleDelete(transaction) {
    const confirmed = window.confirm(
      `Delete "${transaction.title}"? This cannot be undone.`
    );

    if (!confirmed) return;

    setActionError("");

    try {
      await deleteTransaction(transaction._id);

      if (editingId === transaction._id) {
        setEditingId(null);
      }

      await loadTransactions();
    } catch (error) {
      setActionError(error.message || "Could not delete transaction.");
    }
  }

  return (
    <div className="app-shell">
      <Sidebar />

      <main className="main-panel">
        <Navbar />

        <section className="dashboard-content">
          <div className="welcome-row">
            <div>
              <p className="eyebrow">YOUR FINANCIAL OVERVIEW</p>
              <h2>Understand your money.</h2>
              <p className="muted">
                A clearer view of your income, spending, and savings.
              </p>
            </div>

            <span className="demo-badge">LIVE DATA</span>
          </div>

          <div className="backend-status">
            <strong>Backend API:</strong> {backendStatus}
            {backendError && <p role="alert">{backendError}</p>}
          </div>

          <div className="stats-grid">
            {dashboardStats.map((stat) => (
              <StatCard key={stat.label} {...stat} />
            ))}
          </div>

          <section className="panel chart-panel">
            <div className="panel-heading">
              <div>
                <h3>Income vs. expenses</h3>
                <p className="muted">
                  Summary of your recorded transactions
                </p>
              </div>
            </div>

            <ExpenseChart transactions={transactions} />
          </section>

          <AddTransactionForm onTransactionAdded={loadTransactions} />

          <section className="transactions-section">
            <h2>Recent Transactions</h2>

            {transactionsLoading && <p>Loading transactions...</p>}

            {!transactionsLoading && transactionsError && (
              <p role="alert">{transactionsError}</p>
            )}

            {actionError && <p role="alert">{actionError}</p>}

            {!transactionsLoading &&
              !transactionsError &&
              transactions.length === 0 && (
                <p>No transactions found. Add your first transaction above.</p>
              )}

            {!transactionsLoading &&
              !transactionsError &&
              transactions.length > 0 && (
                <div className="transactions-list">
                  {transactions.map((transaction) => (
                    <div className="transaction-item" key={transaction._id}>
                      {editingId === transaction._id ? (
                        <form onSubmit={saveEdit} className="edit-transaction-form">
                          <label>
                            Title
                            <input
                              value={editForm.title}
                              onChange={(event) =>
                                setEditForm({
                                  ...editForm,
                                  title: event.target.value,
                                })
                              }
                              required
                            />
                          </label>

                          <label>
                            Amount (₹)
                            <input
                              type="number"
                              min="0.01"
                              step="0.01"
                              value={editForm.amount}
                              onChange={(event) =>
                                setEditForm({
                                  ...editForm,
                                  amount: event.target.value,
                                })
                              }
                              required
                            />
                          </label>

                          <label>
                            Type
                            <select
                              value={editForm.type}
                              onChange={(event) =>
                                setEditForm({
                                  ...editForm,
                                  type: event.target.value,
                                })
                              }
                            >
                              <option value="income">Income</option>
                              <option value="expense">Expense</option>
                            </select>
                          </label>

                          <label>
                            Category
                            <input
                              value={editForm.category}
                              onChange={(event) =>
                                setEditForm({
                                  ...editForm,
                                  category: event.target.value,
                                })
                              }
                              required
                            />
                          </label>

                          <label>
                            Date
                            <input
                              type="date"
                              value={editForm.date}
                              onChange={(event) =>
                                setEditForm({
                                  ...editForm,
                                  date: event.target.value,
                                })
                              }
                              required
                            />
                          </label>

                          <div className="transaction-actions">
                            <button type="submit" disabled={savingEdit}>
                              {savingEdit ? "Saving..." : "Save"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              disabled={savingEdit}
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : (
                        <>
                          <div className="transaction-details">
                            <h3>{transaction.title}</h3>
                            <p>
                              {transaction.category} · {transaction.date}
                            </p>
                          </div>

                          <strong
                            className={
                              transaction.type === "income"
                                ? "transaction-income"
                                : "transaction-expense"
                            }
                          >
                            {transaction.type === "income" ? "+" : "-"}
                            {formatCurrency(Number(transaction.amount))}
                          </strong>

                          <div className="transaction-actions">
                            <button
                              type="button"
                              onClick={() => startEditing(transaction)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(transaction)}
                            >
                              Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
          </section>

          <section className="insight-panel">
            <div className="insight-symbol">✧</div>
            <div>
              <p className="eyebrow">FINSIGHT INSIGHT</p>
              <h3>Your financial story starts here.</h3>
              <p className="muted">
                Your totals are calculated from saved transactions. More
                advanced spending insights will be added in a later milestone.
              </p>
            </div>
          </section>

          <footer className="dashboard-footer">
            FinSight AI · Personal Finance Intelligence Platform
            <span>Educational tracking tool — not financial advice</span>
          </footer>
        </section>
      </main>
    </div>
  );
}

export default Dashboard;
