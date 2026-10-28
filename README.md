# FinSight AI — Personal Finance Intelligence Platform

A full-stack personal finance platform built with the MERN stack (MongoDB, Express, React, Node.js), featuring explainable financial health scoring, category analytics, and automated transaction management.

---

## Current Architecture & Milestones (Weeks 1–5 Verified)

- **Frontend:** React (v19) + Vite + Recharts + Pure CSS / Modern UI styling
- **Backend:** Node.js + Express + Mongoose + centralized error handling + custom `ApiError` + `asyncHandler`
- **Database:** MongoDB Atlas / Local MongoDB with compound indexes on `{ date: -1, createdAt: -1 }`
- **Testing:** Native Node.js test runner (`node --test`), 34 automated unit & integration tests across frontend and backend.

---

## Project Structure

```text
FinSight_AI/
├── backend/                  # Express REST API
│   ├── src/
│   │   ├── config/           # MongoDB connection & lifecycle logging
│   │   ├── controllers/      # Transaction CRUD & validation logic
│   │   ├── middleware/       # 404 handler & centralized error handler
│   │   ├── models/           # Mongoose schemas (Transaction)
│   │   ├── routes/           # REST endpoints (/api/health, /api/transactions)
│   │   ├── scripts/          # Database seeding script (seed.js)
│   │   └── utils/            # ApiError, asyncHandler
│   ├── tests/                # Automated backend test suites
│   ├── package.json
│   └── .env.example
├── frontend/                 # React + Vite application
│   ├── src/
│   │   ├── components/       # Layout, Charts, Health Score, Filters, Form
│   │   ├── pages/            # Dashboard view
│   │   ├── services/         # API integration with configurable base URL
│   │   └── utils/            # Financial analytics & health score heuristics
│   ├── package.json
│   └── .env.example
├── docs/                     # Architecture, requirements, weekly tracking
└── sample-data/              # Sample CSV files for testing
```

---

## Getting Started (Beginner-Friendly Setup)

### Prerequisites

- **Node.js:** v18+ (Node v20 or v24 recommended)
- **npm:** v9+
- **MongoDB:** A running MongoDB instance (MongoDB Atlas connection string or local MongoDB)

---

### 1. Backend Setup

1. Open your terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create your `.env` configuration file from the template:
   ```bash
   cp .env.example .env
   ```
   Open `backend/.env` in VS Code and set your MongoDB URI:
   ```env
   PORT=5001
   CLIENT_URL=http://localhost:5173
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/finsight?retryWrites=true&w=majority
   ```

4. *(Optional)* Seed synthetic demo transactions (6 months of data):
   ```bash
   npm run seed
   ```

5. Start the backend development server:
   ```bash
   npm run dev
   ```
   The backend will be available at `http://localhost:5001`. Check the health endpoint at `http://localhost:5001/api/health`.

---

### 2. Frontend Setup

1. In a new terminal window, navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. *(Optional)* Configure environment variables:
   ```bash
   cp .env.example .env
   ```

4. Start the Vite development server:
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:5173`.

---

## Running Automated Tests & Quality Checks

### Run All Backend Tests (15 tests)
```bash
cd backend
npm test
```
Tests input validation, edge cases, 404 responses, and centralized error handling.

### Run All Frontend Tests (19 tests)
```bash
cd frontend
node --test src/utils/financialAnalytics.test.mjs
node --test src/utils/financialHealth.test.mjs
```
Tests financial totals, category percentages, date filters, health score boundaries, and insight generators.

### Frontend Lint and Build Verification
```bash
cd frontend
npm run lint
npm run build
```

---

## Verified Features (Weeks 1–5)

- [x] **Express REST API & Health Monitoring:** `/api/health` reports uptime and real-time MongoDB connection status.
- [x] **Transaction CRUD Operations:** Create, Read, Update, Delete transactions with strict validation.
- [x] **Database Indexing:** Compound index on `{ date: -1, createdAt: -1 }` for optimal query speed.
- [x] **Centralized Error Handling:** Standardized JSON error envelopes and custom `ApiError`.
- [x] **Financial Analytics Engine:** Real-time net savings, savings rate, and category breakdowns.
- [x] **Search & Multi-criteria Filtering:** Title search, income/expense toggle, category dropdown, and inclusive date boundary filtering.
- [x] **Explainable Financial Health Score:** 0–100 heuristic score with factor breakdown, category insights, and educational disclaimers.
- [x] **Synthetic Database Seeder:** Generates 6 months of realistic income and expense transactions.

---

## Responsible Financial Disclaimer

FinSight AI is an educational tracking and intelligence tool, not a certified financial advisory platform. All calculated scores and upcoming machine learning projections are informative estimates intended to encourage mindful personal financial habits.
