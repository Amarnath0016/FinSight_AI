
# FinSight AI — Week 2 Report

## Objective
Build a working backend and connect the React dashboard to persistent
MongoDB storage.

## Technology Stack
- Frontend: React, Vite, JavaScript, Recharts
- Backend: Node.js, Express.js
- Database: MongoDB Atlas
- ODM: Mongoose
- API: REST with JSON

## Features Implemented
- Express backend and health-check endpoint
- Create and retrieve transactions
- MongoDB connection through environment variables
- Mongoose transaction schema and validation
- Update existing transactions
- Delete transactions
- Dashboard income, expense, savings and savings-rate calculations
- Transaction list and chart integration
- Frontend API error handling

## Transaction Data
Each transaction contains:
- title
- amount
- type (income or expense)
- category
- date
- createdAt and updatedAt timestamps

## API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | /api/health | Backend health check |
| GET | /api/transactions | List transactions |
| POST | /api/transactions | Create a transaction |
| PUT | /api/transactions/:id | Update a transaction |
| DELETE | /api/transactions/:id | Delete a transaction |

## Validation Plan
- Verify valid transaction creation
- Reject invalid transaction fields
- Verify update and delete responses
- Confirm data persists after a backend restart
- Confirm dashboard totals update after changes
- Check frontend error messages

## Security Notes
- Keep MongoDB credentials in backend/.env
- Do not commit .env or node_modules
- Configure MongoDB network access carefully
- Never expose database credentials in frontend code

## Week 2 Outcome
The project has a persistent transaction API and a React dashboard
that can display and manage financial transactions.

## Next Week
Add transaction filtering, date-range analysis and category-based
financial analytics.
