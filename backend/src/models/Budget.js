const mongoose = require("mongoose");

const budgetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    category: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
      maxlength: [100, "Category name cannot exceed 100 characters"],
    },
    monthlyLimit: {
      type: Number,
      required: [true, "Monthly budget limit is required"],
      min: [1, "Budget limit must be greater than zero"],
    },
  },
  {
    timestamps: true,
  }
);

// Unique compound index: One budget per category per user
budgetSchema.index({ userId: 1, category: 1 }, { unique: true });

module.exports = mongoose.model("Budget", budgetSchema);
