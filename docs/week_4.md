
# Week 4 — Financial Health Score and Explainable Insights

## Objective

Implement a transparent financial health score using recorded income and expenses, and show users the factors that contribute to the score.

## Features

- Calculate net savings, savings rate, and expense-to-income ratio.
- Calculate a score between 0 and 100.
- Display score labels and component-level point breakdowns.
- Generate rule-based explanations from the recorded data.
- Handle missing income and invalid transaction amounts.
- Update the score using the dashboard's current transaction filters.

## Scoring model

The initial heuristic allocates 60 points to the savings-rate component and 40 points to the expense-to-income component.

Savings-rate points:
- Below 0%: 0
- Exactly 0%: 15
- Above 0% and below 10%: 25
- 10% to below 20%: 40
- 20% to below 30%: 50
- 30% or higher: 60

Expense-ratio points:
- 50% or lower: 40
- Above 50% through 70%: 30
- Above 70% through 85%: 20
- Above 85% through 100%: 10
- Above 100%: 0

The total score is the sum of both components.

## Architecture

- `frontend/src/utils/financialHealth.mjs`: pure calculation and insight rules.
- `frontend/src/components/dashboard/FinancialHealthCard.jsx`: score and insight presentation.
- `frontend/src/pages/Dashboard.jsx`: passes filtered transactions into the calculator.
- `frontend/src/App.css`: responsive score-card styling.
- `frontend/src/utils/financialHealth.test.mjs`: automated unit tests.

## Validation

Run:

    node --test src/utils/financialHealth.test.mjs
    npm run lint
    npm run build

## Limitations

This is an educational heuristic, not a validated financial rating. It considers recorded income and expenses only. It does not measure assets, liabilities, emergency savings, unrecorded spending, or long-term financial stability. The score should not be presented as professional financial advice.

## Future improvements

- Include monthly trends and multiple-period comparisons.
- Add debt and emergency-fund indicators once those data are collected.
- Validate the scoring model against documented requirements and representative test data.
- Add more comprehensive accessibility and integration tests.
