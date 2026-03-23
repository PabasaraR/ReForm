require("dotenv").config();
const bcrypt = require("bcryptjs");
const connectDB = require("../config/db");
const User = require("../models/User");

async function seed() {
  await connectDB();

  const email = "pabasara@example.com";
  const password = "Test1234";
  const fullName = "Pabasara Ravindaka";

  const existing = await User.findOne({ email });
  if (existing) {
    console.log(" User already exists:", email);
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await User.create({ fullName, email, passwordHash });

  console.log("Seeded user:");
  console.log("Email:", email);
  console.log("Password:", password);
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
