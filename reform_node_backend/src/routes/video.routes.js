// routes/video.routes.js

const express = require("express");
const multer = require("multer");
const asyncHandler = require("../utils/asyncHandler");
const requireAuth = require("../middleware/auth.middleware");
const {
  analyzeAndSave,
  getMyHistory,
  streamVideoById,
} = require("../controllers/video.controller");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB
});

// Upload + Analyze
router.post("/analyze", requireAuth, upload.single("video"), asyncHandler(analyzeAndSave));

// History
router.get("/me", requireAuth, asyncHandler(getMyHistory));

router.get("/:gridFsId/public-stream", asyncHandler(require("../controllers/video.public").publicStream));

// Stream (for playing video)
router.get("/:id/stream", requireAuth, asyncHandler(streamVideoById));




module.exports = router;
