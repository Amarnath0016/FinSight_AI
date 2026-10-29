const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      required: true,
      enum: ["user", "assistant", "system"],
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    source: {
      type: String,
      enum: ["user_data", "general_education", "hybrid", "system"],
      default: "user_data",
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const conversationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    messages: [messageSchema],
  },
  {
    timestamps: true,
  }
);

// Compound index for fast lookup of a user's recent conversation
conversationSchema.index({ userId: 1, updatedAt: -1 });

module.exports = mongoose.model("Conversation", conversationSchema);
