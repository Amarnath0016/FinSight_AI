const transactionRoutes = require("./routes/transactionRoutes");


const express = require("express");
const cors = require("cors");

const healthRoutes = require("./routes/healthRoutes");

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
  }),
);

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Welcome to FinSight AI API",
  });
});

app.use("/api/health", healthRoutes);
app.use("/api/transactions", transactionRoutes);
module.exports = app;
