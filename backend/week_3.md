
# FinSight AI — Week 3 Report

## Objective

Implement transaction search, filtering, date-range financial analysis,
and category-wise spending analytics using real MongoDB transaction data.

## Technology Stack

- Frontend: React, Vite, JavaScript, CSS
- Backend: Node.js, Express.js
- Database: MongoDB Atlas
- ODM: Mongoose
- Charts: Recharts
- Tests: Node.js built-in test runner

## Features Implemented

- Search transactions by title.
- Filter transactions by income or expense.
- Filter transactions by category.
- Filter transactions by inclusive start and end dates.
- Clear all filters.
- Display an empty state when no transactions match.
- Calculate income, expenses, net savings, and savings rate
  for the selected dataset.
- Aggregate expense totals by category.
- Calculate category spending percentages.
- Identify the highest-spending category.
- Display category analytics with a responsive chart.
- Keep the dashboard synchronized with transaction CRUD operations.

## Financial Calculation Rules

Net savings = Total income - Total expenses

Savings rate = (Net savings / Total income) * 100

If total income is zero, savings rate is set to zero.

Category percentage = (Category expenses / Total expenses) * 100

Category percentages are based on expense transactions in the
currently selected dataset. When no expenses exist, the category
breakdown is empty.

## API Changes

No new backend endpoint is required for Week 3.

The frontend continues to use the existing GET /api/transactions
endpoint. Search, filtering, and analytics are calculated in the
frontend using the retrieved transaction records.

## Files Added or Modified

- frontend/src/components/dashboard/TransactionFilters.jsx
- frontend/src/components/dashboard/CategoryExpenseChart.jsx
- frontend/src/utils/financialAnalytics.js
- frontend/src/utils/financialAnalytics.test.mjs
- frontend/src/pages/Dashboard.jsx
- frontend/src/App.css
- backend/week_3.md

## Test Checklist

- [ ] Search by title, including mixed letter case.
- [ ] Filter income and expenses independently.
- [ ] Filter by category.
- [ ] Check inclusive start and end date boundaries.
- [ ] Reject a reversed date range.
- [ ] Clear all filters.
- [ ] Verify the empty-dataset state.
- [ ] Verify zero-income savings-rate handling.
- [ ] Verify category totals and percentages manually.
- [ ] Verify the highest-spending category.
- [ ] Create, edit, and delete transactions.
- [ ] Verify statistics and charts refresh after CRUD operations.
- [ ] Run Node.js financial analytics tests.
- [ ] Run npm run lint.
- [ ] Run npm run build.

## Test Results

Record actual test results after executing the checklist.
Do not mark unexecuted tests as passed.

## Security Notes

- Keep MongoDB credentials in backend/.env.
- Never commit environment files containing secrets.
- Use synthetic or anonymized financial data during development.

## Week 3 Outcome

The dashboard provides filterable financial summaries and category
spending insights calculated from persisted transaction records.
