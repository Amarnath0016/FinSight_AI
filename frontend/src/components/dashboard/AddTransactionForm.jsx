
import { useState } from "react";
import { createTransaction } from "../../services/api";

function AddTransactionForm({ onTransactionAdded }) {
  const [form, setForm] = useState({
    title: "",
    amount: "",
    type: "expense",
    category: "",
    date: new Date().toLocaleDateString("en-CA"),
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const amount = Number(form.amount);

    if (
      !form.title.trim() ||
      !form.category.trim() ||
      !Number.isFinite(amount) ||
      amount <= 0 ||
      !form.date
    ) {
      setError("Please enter a title, category, valid amount, and date.");
      return;
    }

    setLoading(true);

    try {
      await createTransaction({
        ...form,
        title: form.title.trim(),
        category: form.category.trim(),
        amount,
      });

      setForm({
        title: "",
        amount: "",
        type: "expense",
        category: "",
        date: new Date().toLocaleDateString("en-CA"),
      });

      if (onTransactionAdded) {
        await onTransactionAdded();
      }

      setSuccess("Transaction added successfully.");
    } catch (err) {
      setError(err.message || "Could not add transaction.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel add-transaction-panel">
      <h3>Add Transaction</h3>
      <p className="muted">Record income or an expense.</p>

      <form onSubmit={handleSubmit} className="transaction-form">
        <label>
          Transaction title
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="e.g. Books"
            maxLength={100}
            required
          />
        </label>

        <label>
          Amount (₹)
          <input
            name="amount"
            type="number"
            min="0.01"
            step="0.01"
            value={form.amount}
            onChange={handleChange}
            placeholder="e.g. 500"
            required
          />
        </label>

        <label>
          Type
          <select name="type" value={form.type} onChange={handleChange}>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </label>

        <label>
          Category
          <input
            name="category"
            value={form.category}
            onChange={handleChange}
            placeholder="e.g. Education"
            maxLength={60}
            required
          />
        </label>

        <label>
          Date
          <input
            name="date"
            type="date"
            value={form.date}
            onChange={handleChange}
            required
          />
        </label>

        <button type="submit" disabled={loading}>
          {loading ? "Adding..." : "Add Transaction"}
        </button>

        {error && <p role="alert">{error}</p>}
        {success && <p role="status">{success}</p>}
      </form>
    </section>
  );
}

export default AddTransactionForm;
