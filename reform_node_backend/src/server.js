// server.js

require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/db");
const { initGridFS } = require("./config/gridfs");

const PORT = process.env.PORT || 8000;

async function start() {
  await connectDB();     // mongoose
  await initGridFS();    // gridfs
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
