
# FinSight AI — System Architecture

## 1. Architecture Overview

```mermaid
flowchart TB
    U[User] <--> FE[React + Vite Frontend]
    FE <-->|HTTP / JSON| BE[Node.js + Express Backend]

    BE <--> DB[(MongoDB Atlas)]

    BE <-->|ML API / JSON| ML[Python FastAPI Service]
    ML --> MODEL[Scikit-learn Models]

    BE <-->|Authorized requests| AI[AI Copilot Provider]
    BE --> LOG[Application Logs and Errors]

    subgraph Frontend
        FE
    end

    subgraph Backend
        BE
        LOG
    end

    subgraph Data
        DB
    end

    subgraph Machine Learning
        ML
        MODEL
    end
```

## 2. Main Components

| Component | Responsibility |
|---|---|
| React frontend | User interface, forms, dashboard and charts |
| Express backend | API routes, authentication, validation and business logic |
| MongoDB Atlas | Persistent storage for users and transaction records |
| FastAPI service | Machine-learning inference endpoints |
| Scikit-learn | Clustering, anomaly detection and forecasting models |
| AI Copilot provider | Generates explanations using authorized financial summaries |

## 3. Data Flow — Level 0

```mermaid
flowchart LR
    U[User] -->|Transaction CSV and questions| S((FinSight AI))
    S -->|Dashboard and insights| U
    S <-->|Authorized data storage| DB[(MongoDB)]
    S <-->|Prediction requests and results| ML[ML Service]
```

## 4. Data Flow — Level 1

```mermaid
flowchart TD
    U[User] --> P1[1. Authentication]
    P1 <--> DB[(MongoDB)]

    U --> P2[2. Upload CSV]
    P2 --> P3[3. Validate and Normalize]
    P3 -->|Valid transactions| P4[4. Store Transactions]
    P3 -->|Invalid data| ERR[Return Validation Errors]
    P4 <--> DB

    DB --> P5[5. Calculate Financial Analytics]
    P5 --> P6[6. Generate Dashboard Results]

    P5 --> P7[7. Request ML Predictions]
    P7 <--> ML[FastAPI ML Service]
    ML --> P8[8. Prepare Insights]
    P8 --> P6

    U --> P9[9. Ask AI Copilot]
    P9 --> P10[10. Retrieve Authorized Summaries]
    P10 <--> DB
    P10 --> AI[AI Provider]
    AI --> P11[11. Return Explanation]

    P6 --> U
    P11 --> U
    ERR --> U
```

## 5. Initial Data Model

```mermaid
erDiagram
    USER ||--o{ TRANSACTION : owns
    USER ||--o{ UPLOAD : submits
    USER ||--o{ ANALYTIC_RESULT : receives

    USER {
        string id PK
        string name
        string email UK
        string passwordHash
        datetime createdAt
    }

    TRANSACTION {
        string id PK
        string userId FK
        date transactionDate
        string description
        string category
        string type
        number amount
        string uploadId
    }

    UPLOAD {
        string id PK
        string userId FK
        string filename
        number rowCount
        string status
        datetime uploadedAt
    }

    ANALYTIC_RESULT {
        string id PK
        string userId FK
        string resultType
        string resultJson
        datetime generatedAt
    }
```

## 6. Security Principles

- Store password hashes, never plain-text passwords.
- Keep secrets in environment variables.
- Validate uploaded files and all API inputs.
- Restrict every user's records to that authenticated user.
- Do not expose database credentials or AI provider keys to the frontend.
- Use synthetic or anonymized data during development.
- Treat ML predictions and AI explanations as estimates, not guaranteed financial advice.

## 7. Initial Architecture Decisions

- Use REST APIs for frontend-to-backend communication.
- Use JSON for API responses.
- Use MongoDB with Mongoose for data persistence.
- Keep the ML service separate from the Express backend.
- Start with explainable calculations before adding complex ML models.
- Store only the analytics results that need persistence; calculate simple summaries when appropriate.
- Review data retention and privacy requirements before storing sensitive financial records.
