// app.js

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./routes/auth.routes");
const videoRoutes = require("./routes/video.routes");
const errorMiddleware = require("./middleware/error.middleware");

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "20mb" }));
app.use(morgan("dev"));

app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 120,
  })
);

app.get("/", (req, res) => {
  res.json({ message: "ReForm API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/videos", videoRoutes);

app.use(errorMiddleware);

module.exports = app;
