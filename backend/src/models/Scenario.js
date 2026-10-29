const mongoose = require("mongoose");

const scenarioSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Scenario name is required"],
      trim: true,
      maxlength: [100, "Scenario name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [300, "Description cannot exceed 300 characters"],
      default: "",
    },
    adjustments: {
      monthlyIncomeDelta: { type: Number, default: 0 },
      incomePercentChange: { type: Number, default: 0 },
      categoryAdjustments: {
        type: Map,
        of: Number,
        default: () => new Map(),
      },
      additionalMonthlyExpense: { type: Number, default: 0 },
      targetGoal: {
        name: { type: String, default: "" },
        targetAmount: { type: Number, default: 0 },
      },
    },
    simulatedOutcome: {
      baselineIncome: { type: Number, default: 0 },
      simulatedIncome: { type: Number, default: 0 },
      baselineExpenses: { type: Number, default: 0 },
      simulatedExpenses: { type: Number, default: 0 },
      baselineSavings: { type: Number, default: 0 },
      simulatedSavings: { type: Number, default: 0 },
      baselineSavingsRate: { type: Number, default: 0 },
      simulatedSavingsRate: { type: Number, default: 0 },
      baselineScore: { type: Number, default: null },
      simulatedScore: { type: Number, default: null },
      annualDelta: { type: Number, default: 0 },
      monthsToGoalBase: { type: Number, default: null },
      monthsToGoalSim: { type: Number, default: null },
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for fast lookup of a user's scenarios ordered by creation date
scenarioSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Scenario", scenarioSchema);
