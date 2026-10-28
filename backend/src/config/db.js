const mongoose = require("mongoose");

async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error(
      "MongoDB connection error: MONGODB_URI is not defined in your environment variables. Please check your backend/.env file."
    );
    process.exit(1);
  }

  // Register connection lifecycle event listeners
  mongoose.connection.on("disconnected", () => {
    console.warn("MongoDB disconnected. Attempting reconnection...");
  });

  mongoose.connection.on("reconnected", () => {
    console.log("MongoDB reconnected successfully.");
  });

  mongoose.connection.on("error", (err) => {
    console.error("MongoDB runtime connection error:", err.message);
  });

  try {
    const connection = await mongoose.connect(uri);
    console.log(`MongoDB connected: ${connection.connection.host}`);
    return connection;
  } catch (error) {
    console.error("MongoDB initial connection failed:", error.message);
    process.exit(1);
  }
}

module.exports = connectDB;
