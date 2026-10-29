const Conversation = require("../models/Conversation");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { sanitizePrompt, buildGroundedContext } = require("../services/contextBuilder.service");
const { askCopilot } = require("../services/ai.service");

// POST /api/copilot/chat
const chatWithCopilot = asyncHandler(async (req, res) => {
  const { message } = req.body;

  if (!message || typeof message !== "string" || !message.trim()) {
    throw ApiError.badRequest("Please enter a question for the AI Copilot.");
  }

  const { isSafe, sanitized, warning } = sanitizePrompt(message);
  const userPrompt = isSafe ? message.trim() : sanitized;

  // Retrieve user-isolated context
  const context = await buildGroundedContext(req.user.id, req.user);

  // Generate grounded answer
  const aiResponse = await askCopilot(userPrompt, context);

  // Persist conversation to MongoDB
  let conversation = await Conversation.findOne({ userId: req.user.id });
  if (!conversation) {
    conversation = new Conversation({ userId: req.user.id, messages: [] });
  }

  const userMsgObj = {
    role: "user",
    content: message.trim(),
    source: "user_data",
    timestamp: new Date(),
  };

  const assistantMsgObj = {
    role: "assistant",
    content: warning ? `${warning}\n\n${aiResponse.content}` : aiResponse.content,
    source: aiResponse.source || "user_data",
    timestamp: new Date(),
  };

  conversation.messages.push(userMsgObj, assistantMsgObj);

  // Keep max 50 recent messages in history to prevent unbounded document growth
  if (conversation.messages.length > 50) {
    conversation.messages = conversation.messages.slice(-50);
  }

  await conversation.save();

  return res.status(200).json({
    success: true,
    message: assistantMsgObj,
    contextSummary: {
      hasData: context.hasData,
      totalIncome: context.summary?.totalIncome ?? 0,
      totalExpenses: context.summary?.totalExpenses ?? 0,
      savingsRate: context.summary?.savingsRate ?? 0,
      healthScore: context.health?.score ?? null,
      totalTransactions: context.totalTransactions,
    },
  });
});

// GET /api/copilot/history
const getConversationHistory = asyncHandler(async (req, res) => {
  const conversation = await Conversation.findOne({ userId: req.user.id }).lean();

  return res.status(200).json({
    success: true,
    messages: conversation?.messages || [],
  });
});

// DELETE /api/copilot/history
const clearConversationHistory = asyncHandler(async (req, res) => {
  await Conversation.deleteOne({ userId: req.user.id });

  return res.status(200).json({
    success: true,
    message: "Conversation history cleared successfully.",
  });
});

module.exports = {
  chatWithCopilot,
  getConversationHistory,
  clearConversationHistory,
};
