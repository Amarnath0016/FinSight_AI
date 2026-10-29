const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5001";

const TOKEN_KEY = "finsight_auth_token";

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function clearStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem("finsight_auth_user");
}

function getAuthHeaders() {
  const token = getStoredToken();
  const headers = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
}

// ----------------- Auth API -----------------

export async function loginUser(credentials) {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || `Login failed with status ${response.status}`);
  }

  setStoredToken(result.token);
  localStorage.setItem("finsight_auth_user", JSON.stringify(result.user));

  return result;
}

export async function registerUser(userData) {
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || `Registration failed with status ${response.status}`);
  }

  setStoredToken(result.token);
  localStorage.setItem("finsight_auth_user", JSON.stringify(result.user));

  return result;
}

export async function getMe() {
  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    headers: getAuthHeaders(),
  });

  if (response.status === 401) {
    clearStoredToken();
    throw new Error("Session expired. Please log in again.");
  }

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Failed to fetch profile");
  }

  return result.user;
}

// ----------------- Health & Transaction API -----------------

export async function checkBackendHealth() {
  const response = await fetch(`${API_BASE_URL}/api/health`);

  if (!response.ok) {
    throw new Error(`Backend request failed: ${response.status}`);
  }

  return response.json();
}

export async function getTransactions() {
  const response = await fetch(`${API_BASE_URL}/api/transactions`, {
    headers: getAuthHeaders(),
  });

  if (response.status === 401) {
    clearStoredToken();
    window.location.href = "/login";
    throw new Error("Session expired. Please log in again.");
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch transactions: ${response.status}`);
  }

  const result = await response.json();
  return result.data;
}

export async function createTransaction(transaction) {
  const response = await fetch(`${API_BASE_URL}/api/transactions`, {
    method: "POST",
    headers: getAuthHeaders(),
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
    headers: getAuthHeaders(),
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
    headers: getAuthHeaders(),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.message || `Failed to delete transaction: ${response.status}`
    );
  }

  return result;
}


// ----------------- CSV Upload & Preview API -----------------

export async function previewCsvUpload(file) {
  const token = getStoredToken();
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/api/upload/preview`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || `CSV preview failed: ${response.status}`);
  }

  return result;
}

export async function commitCsvUpload(transactions) {
  const response = await fetch(`${API_BASE_URL}/api/upload/commit`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ transactions }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || `CSV commit failed: ${response.status}`);
  }

  return result;
}


// ----------------- ML Analytics API -----------------

export async function getUserSegmentation() {
  const response = await fetch(`${API_BASE_URL}/api/analytics/segmentation`, {
    headers: getAuthHeaders(),
  });

  if (response.status === 401) {
    clearStoredToken();
    window.location.href = "/login";
    throw new Error("Session expired. Please log in again.");
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch ML segmentation: ${response.status}`);
  }

  return response.json();
}


// ----------------- AI Copilot API -----------------

export async function sendCopilotMessage(message) {
  const response = await fetch(`${API_BASE_URL}/api/copilot/chat`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ message }),
  });

  if (response.status === 401) {
    clearStoredToken();
    window.location.href = "/login";
    throw new Error("Session expired. Please log in again.");
  }

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || `Copilot request failed: ${response.status}`);
  }

  return result;
}

export async function getCopilotHistory() {
  const response = await fetch(`${API_BASE_URL}/api/copilot/history`, {
    headers: getAuthHeaders(),
  });

  if (response.status === 401) {
    clearStoredToken();
    window.location.href = "/login";
    throw new Error("Session expired. Please log in again.");
  }

  const result = await response.json();

  if (!response.ok) {
    throw new Error(`Failed to load chat history: ${response.status}`);
  }

  return result.messages || [];
}

export async function clearCopilotHistory() {
  const response = await fetch(`${API_BASE_URL}/api/copilot/history`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(`Failed to clear chat history: ${response.status}`);
  }

  return result;
}
