const mongoose = require("mongoose");

// function to connect to MongoDB
async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("MONGO_URI is missing in .env");
  // connect to MongoDB database
  mongoose.set("strictQuery", true);

  await mongoose.connect(uri);
  console.log(" MongoDB connected");
}

module.exports = connectDB;
