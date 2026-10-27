# Week 5 — MongoDB Integration and Transaction Persistence

## 1. Overview

Week 5 focuses on integrating MongoDB with the FinSight AI backend to store
financial transactions persistently. The backend uses Express.js for REST APIs
and Mongoose to interact with MongoDB.

## 2. Objectives

- Connect the backend to MongoDB using environment variables.
- Define a Mongoose schema for financial transactions.
- Implement transaction CRUD operations.
- Validate transaction input before saving or updating records.
- Return consistent JSON responses and appropriate HTTP status codes.
- Verify that transaction data is stored in the database.

## 3. Technology Stack

- Node.js
- Express.js
- MongoDB
- Mongoose
- dotenv
- JavaScript
- curl for manual API testing

## 4. Backend Architecture

The request flow is:

Client → Express routes → Transaction controller → Mongoose model → MongoDB

### Database connection

File: `src/config/db.js`

The `connectDB()` function connects to MongoDB using `MONGODB_URI`.
The server waits for the database connection before starting to listen for
HTTP requests.

### Transaction model

File: `src/models/Transaction.js`

The transaction schema defines these fields:

| Field | Type | Validation |
|---|---|---|
| title | String | Required, trimmed |
| amount | Number | Required, greater than zero |
| type | String | `income` or `expense` |
| category | String | Required, trimmed |
| date | String | Required, YYYY-MM-DD format |

Mongoose timestamps automatically maintain `createdAt` and `updatedAt`.

### Transaction controller

File: `src/controllers/transactionController.js`

The controller validates request data and uses the Mongoose model to perform
database operations. It returns JSON responses with appropriate status codes.

### Transaction routes

File: `src/routes/transactionRoutes.js`

The following endpoints are available:

| Method | Endpoint | Purpose | Expected success status |
|---|---|---|---|
| GET | `/api/transactions` | Retrieve transactions | 200 |
| POST | `/api/transactions` | Create a transaction | 201 |
| PUT | `/api/transactions/:id` | Update a transaction | 200 |
| DELETE | `/api/transactions/:id` | Delete a transaction | 200 |

Invalid transaction IDs return HTTP 400. A transaction that does not exist
returns HTTP 404 for update and delete operations.

## 5. Input Validation

The transaction controller validates:

- Non-empty title and category.
- A positive, finite transaction amount.
- A supported transaction type.
- A valid date in YYYY-MM-DD format.

Invalid transaction details are rejected with HTTP 400 rather than being
saved to the database.

## 6. Manual Test Results

Tests confirmed during development:

| Test | Result |
|---|---|
| Create a transaction using POST | Passed — HTTP 201 |
| Retrieve transactions using GET | Passed — HTTP 200 |
| Update a transaction using PUT | Passed — HTTP 200 |
| Reject invalid transaction input | Passed — HTTP 400 |

Additional verification to complete before release:

- Restart the backend and confirm the updated record still exists.
- Test DELETE and verify that the temporary test record is removed.
- Run the final frontend lint and production build checks.

## 7. Environment Configuration

The backend loads environment variables through dotenv.

Required configuration includes:

- `PORT`: backend listening port.
- `MONGODB_URI`: MongoDB connection URI.

Real credentials and connection strings must remain in an ignored `.env` file.
Never commit `.env` or expose database credentials in documentation.

## 8. Limitations and Security Considerations

The current transaction endpoints do not yet enforce per-user transaction
ownership. Authentication and authorization must be added before the API is
used as a secure multi-user finance application.

The health score and financial analytics also depend on the transaction data
available to the application.

## 9. Week 5 Outcome

The backend has a Mongoose transaction model, a MongoDB connection function,
and REST endpoints for creating, retrieving, updating, and deleting transactions.
Manual tests confirmed transaction creation, retrieval, updating, and rejection
of invalid input.

Persistence-after-restart and deletion should be verified before marking every
Week 5 test as complete.
