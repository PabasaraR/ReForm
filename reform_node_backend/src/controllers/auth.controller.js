// controllers/auth.controller.js

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// function to create JWT token for user
function signToken(user) {
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";
  if (!secret) throw new Error("JWT_SECRET is missing in .env");

  return jwt.sign(
    { sub: user._id.toString(), email: user.email },
    secret,
    { expiresIn }
  );
}

// signup controller
exports.signup = async (req, res) => {
  const { fullName, email, password } = req.body;

  if (!fullName || !email || !password) {
    return res.status(400).json({ message: "Full name, email and password are required." });
  }
  // clean input values
  const cleanEmail = String(email).toLowerCase().trim();
  const cleanName = String(fullName).trim();

  // simple password rule 
  if (String(password).length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters." });
  }

  // check if user already exists
  const existing = await User.findOne({ email: cleanEmail });
  if (existing) {
    return res.status(409).json({ message: "Email already exists. Please sign in." });
  }

  const passwordHash = await bcrypt.hash(String(password), 12);
  // create new user in database
  const user = await User.create({
    fullName: cleanName,
    email: cleanEmail,
    passwordHash,
  });
  // generate token
  const token = signToken(user);

  return res.status(201).json({
    token,
    user: {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
    },
  });
};

// signin controller
exports.signin = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  // find user by email
  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) {
    return res.status(401).json({ message: "Invalid email or password." });
  }
  // check password 
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return res.status(401).json({ message: "Invalid email or password." });
  }

  const token = signToken(user);

  return res.json({
    token,
    user: {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
    },
  });
};
