const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5001";

export async function checkBackendHealth() {
  const response = await fetch(`${API_BASE_URL}/api/health`);

  if (!response.ok) {
    throw new Error(`Backend request failed: ${response.status}`);
  }

  return response.json();
}

export async function getTransactions() {
  const response = await fetch(`${API_BASE_URL}/api/transactions`);

  if (!response.ok) {
    throw new Error(`Failed to fetch transactions: ${response.status}`);
  }

  const result = await response.json();

  return result.data;
}

export async function createTransaction(transaction) {
  const response = await fetch(`${API_BASE_URL}/api/transactions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...transaction,
      amount: Number(transaction.amount),
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.message || `Failed to create transaction: ${response.status}`
    );
  }

  return result.data;
}

export async function updateTransaction(id, transaction) {
  const response = await fetch(`${API_BASE_URL}/api/transactions/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...transaction,
      amount: Number(transaction.amount),
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.message || `Failed to update transaction: ${response.status}`
    );
  }

  return result.data;
}

export async function deleteTransaction(id) {
  const response = await fetch(`${API_BASE_URL}/api/transactions/${id}`, {
    method: "DELETE",
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.message || `Failed to delete transaction: ${response.status}`
    );
  }

  return result;
}
