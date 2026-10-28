# FinSight AI — Personal Finance Intelligence Platform

A full-stack personal finance platform built with the MERN stack (MongoDB, Express, React, Node.js), featuring explainable financial health scoring, category analytics, and automated transaction management.

---

## Current Architecture & Milestones (Weeks 1–5 Verified)

- **Frontend:** React (v19) + Vite + Recharts + React Router + Context API Authentication
- **Backend:** Node.js + Express + Mongoose + JWT Authentication + bcryptjs + centralized error handling
- **Database:** MongoDB Atlas / Local MongoDB with compound indexes on `{ userId: 1, date: -1, createdAt: -1 }`
- **Machine Learning:** Python (FastAPI + scikit-learn + Pydantic + StandardScaler + KMeans k=3)
- **Testing:** 56 automated tests across Node.js (`node --test`) and Python (`pytest`).

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

### 3. Machine Learning Microservice Setup (FastAPI + scikit-learn)

1. In a new terminal window, navigate to the `ml-service` directory:
   ```bash
   cd ml-service
   ```

2. Activate the pre-configured virtual environment:
   ```bash
   source .venv/bin/activate
   ```

3. Start the FastAPI microservice with Uvicorn:
   ```bash
   uvicorn app.main:app --port 8000 --reload
   ```
   The ML API will be accessible at `http://127.0.0.1:8000`. You can test the interactive OpenAPI docs at `http://127.0.0.1:8000/docs`.

---

## Running Automated Tests & Quality Checks

### Run All Backend Tests (32 tests)
```bash
cd backend
npm test
```
Tests authentication, authorization, CSV parsing, feature engineering, and resilient ML fallbacks.

### Run All Frontend Tests (19 tests)
```bash
cd frontend
npm test
```
Tests financial analytics and health score heuristics.

### Run Python ML Service Tests (5 tests)
```bash
cd ml-service
source .venv/bin/activate
pytest tests
```
Tests FastAPI endpoints, StandardScaler normalization, and K-Means segmentation predictions.

### Frontend Lint and Build Verification
```bash
cd frontend
npm run lint
npm run build
```

---

## Verified Features (Weeks 1–5 + Priority A, B & C: Auth, CSV, ML Service)

- [x] **Python ML Microservice (FastAPI + scikit-learn):** Standalone ML service with `/health` and `/segmentation/predict` endpoints.
- [x] **Unsupervised K-Means Behavioral Clustering (k=3):** Normalizes spending vectors using `StandardScaler` to classify users into *Disciplined Saver*, *Balanced Spender*, or *High-Outflow Spender*.
- [x] **Resilient Node-to-Python Gateway:** Express backend calls the ML service with automatic timeouts (3.5s) and graceful heuristic fallback so dashboard never crashes if the Python service is offline.
- [x] **Frontend Cluster Insights View:** Dedicated visual dashboard page displaying the active behavioral archetype, engineered features, and actionable recommendations.
- [x] **Two-Step CSV Ingestion Pipeline:** File upload, streaming parsing (`csv-parse`), in-memory row validation, and safe commit (`/api/upload/preview` and `/api/upload/commit`).
- [x] **Row-Level Error & Duplicate Detection:** Flags invalid dates, missing descriptions, negative values, and in-file duplicates without corrupting the database.
- [x] **Interactive CSV Preview UI:** Drag-and-drop dropzone, preview tables for valid and rejected records, and one-click bulk import into MongoDB.
- [x] **Sample Data Files:** Pre-bundled [`sample-data/valid_transactions.csv`](file:///Users/amarnathyadav/Desktop/FinSight_AI/sample-data/valid_transactions.csv) and [`sample-data/mixed_transactions.csv`](file:///Users/amarnathyadav/Desktop/FinSight_AI/sample-data/mixed_transactions.csv).
- [x] **User Authentication & Session Management:** User registration, login, and JWT stateless tokens with `bcryptjs` password hashing.
- [x] **Strict Data Ownership & User Isolation:** All transactions are scoped to `userId` from the verified JWT. Insecure Direct Object References (IDOR) are strictly blocked on GET, POST, PUT, and DELETE.
- [x] **Protected React Routing:** `ProtectedRoute` component guarding the dashboard, clusters, and upload views.
- [x] **Demo Login Shortcut:** Pre-fills test credentials (`demo@finsight.ai` / `Password123!`) for fast local evaluations.
- [x] **Express REST API & Health Monitoring:** `/api/health` reports uptime and real-time MongoDB connection status.
- [x] **Transaction CRUD Operations:** Create, Read, Update, Delete transactions with strict validation.
- [x] **Database Indexing:** Compound index on `{ userId: 1, date: -1, createdAt: -1 }` for optimal query speed.
- [x] **Centralized Error Handling:** Standardized JSON error envelopes and custom `ApiError`.
- [x] **Financial Analytics Engine:** Real-time net savings, savings rate, and category breakdowns.
- [x] **Search & Multi-criteria Filtering:** Title search, income/expense toggle, category dropdown, and inclusive date boundary filtering.
- [x] **Explainable Financial Health Score:** 0–100 heuristic score with factor breakdown, category insights, and educational disclaimers.
- [x] **Synthetic Database Seeder:** Generates a demo user and 6 months of realistic user-scoped transactions.

---

## Responsible Financial Disclaimer

FinSight AI is an educational tracking and intelligence tool, not a certified financial advisory platform. All calculated scores and upcoming machine learning projections are informative estimates intended to encourage mindful personal financial habits.
