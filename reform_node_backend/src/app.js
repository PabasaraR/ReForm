// app.js
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

// import route files and middleware
const authRoutes = require("./routes/auth.routes");
const videoRoutes = require("./routes/video.routes");
const errorMiddleware = require("./middleware/error.middleware");

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "20mb" }));
app.use(morgan("dev"));

// limit number of requests to prevent spam
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 120,
  })
);
// use authentication routes
app.use("/api/auth", authRoutes);
// use video routes
app.use("/api/videos", videoRoutes);
// handle errors 
app.use(errorMiddleware);

module.exports = app;
