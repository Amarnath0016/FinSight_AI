const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User");
const Transaction = require("../models/Transaction");

const DEMO_USER = {
  name: "Demo Investor",
  email: "demo@finsight.ai",
  password: "Password123!",
  role: "user",
};

const sampleTransactions = [
  // Month 1
  { title: "Monthly Salary", amount: 65000, type: "income", category: "Salary", date: "2026-05-01" },
  { title: "Apartment Rent", amount: 18000, type: "expense", category: "Housing", date: "2026-05-02" },
  { title: "Supermarket Groceries", amount: 4500, type: "expense", category: "Food", date: "2026-05-05" },
  { title: "Electricity & Water Bill", amount: 2200, type: "expense", category: "Utilities", date: "2026-05-08" },
  { title: "Freelance UI Design", amount: 12000, type: "income", category: "Freelance", date: "2026-05-12" },
  { title: "Internet Fiber Plan", amount: 1199, type: "expense", category: "Utilities", date: "2026-05-15" },
  { title: "Dinner with Friends", amount: 2400, type: "expense", category: "Entertainment", date: "2026-05-18" },
  { title: "Metro Pass", amount: 1500, type: "expense", category: "Transportation", date: "2026-05-20" },

  // Month 2
  { title: "Monthly Salary", amount: 65000, type: "income", category: "Salary", date: "2026-06-01" },
  { title: "Apartment Rent", amount: 18000, type: "expense", category: "Housing", date: "2026-06-02" },
  { title: "Weekly Groceries", amount: 5200, type: "expense", category: "Food", date: "2026-06-06" },
  { title: "Electricity Bill", amount: 2800, type: "expense", category: "Utilities", date: "2026-06-10" },
  { title: "Online Technical Course", amount: 3500, type: "expense", category: "Education", date: "2026-06-14" },
  { title: "Health Checkup & Meds", amount: 2100, type: "expense", category: "Healthcare", date: "2026-06-22" },

  // Month 3
  { title: "Monthly Salary", amount: 65000, type: "income", category: "Salary", date: "2026-07-01" },
  { title: "Apartment Rent", amount: 18000, type: "expense", category: "Housing", date: "2026-07-02" },
  { title: "Consulting Project", amount: 15000, type: "income", category: "Freelance", date: "2026-07-08" },
  { title: "Groceries & Supplies", amount: 4800, type: "expense", category: "Food", date: "2026-07-09" },
  { title: "Car Service & Fuel", amount: 4200, type: "expense", category: "Transportation", date: "2026-07-16" },
  { title: "Streaming Subscriptions", amount: 899, type: "expense", category: "Entertainment", date: "2026-07-20" },

  // Month 4
  { title: "Monthly Salary", amount: 65000, type: "income", category: "Salary", date: "2026-08-01" },
  { title: "Apartment Rent", amount: 18000, type: "expense", category: "Housing", date: "2026-08-02" },
  { title: "Organic Market", amount: 5100, type: "expense", category: "Food", date: "2026-08-07" },
  { title: "Internet & Mobile", amount: 1699, type: "expense", category: "Utilities", date: "2026-08-11" },
  { title: "Books & Stationeries", amount: 1200, type: "expense", category: "Education", date: "2026-08-19" },
  { title: "Gym Membership", amount: 2000, type: "expense", category: "Healthcare", date: "2026-08-25" },

  // Month 5
  { title: "Monthly Salary", amount: 65000, type: "income", category: "Salary", date: "2026-09-01" },
  { title: "Apartment Rent", amount: 18000, type: "expense", category: "Housing", date: "2026-09-02" },
  { title: "Freelance Web Development", amount: 20000, type: "income", category: "Freelance", date: "2026-09-05" },
  { title: "Groceries Restock", amount: 5600, type: "expense", category: "Food", date: "2026-09-08" },
  { title: "Concert Tickets", amount: 3200, type: "expense", category: "Entertainment", date: "2026-09-17" },
  { title: "Metro Commute Pass", amount: 1500, type: "expense", category: "Transportation", date: "2026-09-22" },

  // Month 6 (Recent)
  { title: "Monthly Salary", amount: 65000, type: "income", category: "Salary", date: "2026-10-01" },
  { title: "Apartment Rent", amount: 18000, type: "expense", category: "Housing", date: "2026-10-02" },
  { title: "Vegetables & Groceries", amount: 4900, type: "expense", category: "Food", date: "2026-10-05" },
  { title: "Electricity Bill", amount: 2350, type: "expense", category: "Utilities", date: "2026-10-10" },
  { title: "Festival Shopping", amount: 6500, type: "expense", category: "Shopping", date: "2026-10-15" },
  { title: "Quarterly Performance Bonus", amount: 25000, type: "income", category: "Bonus", date: "2026-10-20" },
  { title: "Dinner Outing", amount: 1850, type: "expense", category: "Food", date: "2026-10-24" },
];

async function seedData() {
  try {
    console.log("Connecting to MongoDB to seed user and transaction data...");
    await connectDB();

    // 1. Find or create demo user
    let user = await User.findOne({ email: DEMO_USER.email });
    if (!user) {
      console.log(`Creating demo user: ${DEMO_USER.email}`);
      user = await User.create(DEMO_USER);
      console.log(`Demo user created with ID: ${user._id}`);
    } else {
      console.log(`Existing demo user found with ID: ${user._id}`);
    }

    // 2. Assign any unassigned legacy transactions to demo user
    const updatedLegacy = await Transaction.updateMany(
      { userId: { $exists: false } },
      { $set: { userId: user._id } }
    );
    if (updatedLegacy.modifiedCount > 0) {
      console.log(`Updated ${updatedLegacy.modifiedCount} legacy transactions with demo userId.`);
    }

    // 3. Clear existing transactions for demo user to avoid duplicate stacking
    await Transaction.deleteMany({ userId: user._id });
    console.log("Cleared prior demo transactions to prevent duplicate accumulation.");

    // 4. Attach demo userId to all sample transactions
    const userTransactions = sampleTransactions.map((tx) => ({
      ...tx,
      userId: user._id,
    }));

    const result = await Transaction.insertMany(userTransactions);
    console.log(`Successfully seeded ${result.length} user-scoped synthetic transactions.`);

    const userCount = await Transaction.countDocuments({ userId: user._id });
    console.log(`Total transactions for ${DEMO_USER.email}: ${userCount}`);
    console.log("\nDemo Credentials:");
    console.log(`  Email:    ${DEMO_USER.email}`);
    console.log(`  Password: ${DEMO_USER.password}\n`);

    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error.message);
    process.exit(1);
  }
}

seedData();
