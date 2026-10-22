# FinSight AI — Software Requirements

## 1. Project Overview

**Project Name:** FinSight AI: A Personal Finance Intelligence Platform

**Purpose:** Help users understand spending habits, analyze financial transactions, monitor financial indicators, and explore data-driven financial insights.

## 2. Problem Statement

People may have difficulty understanding where their money goes, recognizing spending patterns, and estimating future expenses. FinSight AI aims to organize transaction data and present understandable analytics through a unified platform.

## 3. Project Objectives

1. Import and manage transaction data using CSV files.
2. Calculate income, expenses, savings, and spending patterns.
3. Generate transparent financial health indicators.
4. Explore machine-learning-based spending segmentation.
5. Identify potentially unusual transactions.
6. Forecast future expenses using historical data.
7. Present results through an interactive dashboard.
8. Provide an AI Copilot that explains available analytics.
9. Simulate hypothetical financial changes without modifying real transactions.

## 4. Functional Requirements

- **FR-01: Authentication** — Users can register, log in, and access their own data.
- **FR-02: CSV Upload** — Users can upload transaction files for validation and preview.
- **FR-03: Transaction Management** — Users can view, filter, and manage imported transactions.
- **FR-04: Financial Analytics** — Calculate income, expenses, savings, and category totals.
- **FR-05: Health Score** — Display an explainable score based on documented financial metrics.
- **FR-06: Clustering** — Group similar financial behavior using suitable features.
- **FR-07: Risk Classification** — Evaluate defined financial risk indicators.
- **FR-08: Anomaly Detection** — Flag transactions that differ from learned or configured patterns.
- **FR-09: Forecasting** — Estimate future expenses from historical data.
- **FR-10: Dashboard** — Show summaries, trends, and analytics charts.
- **FR-11: AI Copilot** — Answer questions about available financial summaries.
- **FR-12: What-If Simulation** — Explore hypothetical changes without changing saved transactions.

## 5. Non-Functional Requirements

- **NFR-01: Security** — Protect credentials, API keys, and user financial data.
- **NFR-02: Privacy** — Users must not access another user's private financial records.
- **NFR-03: Reliability** — Invalid uploads and failed requests should return understandable errors.
- **NFR-04: Maintainability** — Keep frontend, backend, database logic, and ML code organized separately.
- **NFR-05: Usability** — Provide clear navigation, readable charts, loading states, and empty states.
- **NFR-06: Testability** — Test important calculations, APIs, validation, and ML outputs.
- **NFR-07: Documentation** — Document installation, configuration, architecture, and usage.

## 6. Initial Technology Stack

- Frontend: React, Vite, Tailwind CSS
- Backend: Node.js, Express
- Database: MongoDB Atlas, Mongoose
- Machine Learning: Python, FastAPI, scikit-learn
- Version Control: Git and GitHub
- API Testing: Postman

## 7. Assumptions and Limitations

- Initial development will use synthetic or anonymized transaction data.
- Uploaded files must be validated before being accepted.
- Machine-learning outputs are estimates and require evaluation.
- The health score is an explanatory product metric, not a certified financial assessment.
- AI-generated explanations must be grounded in available data and communicate uncertainty.

## 8. Initial Acceptance Criteria

- The project structure and development tools are ready.
- Each planned module has a documented purpose.
- The architecture and data flow are documented.
- Sensitive configuration is excluded from version control.
- The repository contains setup instructions and a weekly task board.
