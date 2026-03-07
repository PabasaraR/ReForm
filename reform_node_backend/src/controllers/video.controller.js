// controllers/video.controller.js

const axios = require("axios");
const FormData = require("form-data");
const mongoose = require("mongoose");
const Video = require("../models/Video");
const { getBucket } = require("../config/gridfs");

function safeExercise(ex) {
  const x = String(ex || "").trim().toLowerCase();
  const allowed = ["barbell_curl", "dumbbell_shoulder_press"];
  return allowed.includes(x) ? x : null;
}

exports.analyzeAndSave = async (req, res) => {
  console.log("Received video upload request.");
  const userId = req.user.id;
  const exercise = safeExercise(req.body.exercise);

  if (!exercise) return res.status(400).json({ message: "Invalid exercise." });
  if (!req.file) return res.status(400).json({ message: "Video file is required." });

  const bucket = getBucket();

  // 1) Upload to GridFS
  const fileId = new mongoose.Types.ObjectId();

  const uploadStream = bucket.openUploadStreamWithId(fileId, req.file.originalname, {
    contentType: req.file.mimetype || "video/mp4",
    metadata: {
      userId,
      exercise,
    },
  });

  uploadStream.end(req.file.buffer);

  await new Promise((resolve, reject) => {
    uploadStream.on("finish", resolve);
    uploadStream.on("error", reject);
  });

  // 2) Make a URL that Python can download from Node
  // IMPORTANT: Python must be able to reach this URL (same network / IP)
  const base = `${req.protocol}://${req.get("host")}`;
  const videoUrl = `${base}/api/videos/${fileId.toString()}/public-stream`;

  // 3) Call Python ML backend using URL
  const pyBase = process.env.PYTHON_API_BASE;
  if (!pyBase) throw new Error("PYTHON_API_BASE missing in .env");

  const form = new FormData();
  form.append("exercise", exercise);
  form.append("video_url", videoUrl);

  const pyRes = await axios.post(`${pyBase}/analyze_url`, form, {
    headers: form.getHeaders(),
    timeout: 1000 * 60 * 5,
  });

  const resultObj = pyRes.data?.result ? pyRes.data.result : pyRes.data;

  // 4) Save metadata + ML result to MongoDB
  const doc = await Video.create({
    userId,
    exercise,
    gridFsId: fileId,
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    sizeBytes: req.file.size,
    result: {
      label: resultObj?.label ?? "",
      bad_ratio: typeof resultObj?.bad_ratio === "number" ? resultObj.bad_ratio : null,
      feedback: resultObj?.feedback ?? "",
      continuous_frames_before: resultObj?.continuous_frames_before ?? [],
      continuous_frames_after: resultObj?.continuous_frames_after?? [],
      raw: resultObj ?? {},
    },
  });

  return res.json({
    videoId: doc._id,
    exercise,
    gridFsId: fileId.toString(),
    // Use the protected stream for your app user
    streamUrl: `${base}/api/videos/${doc._id.toString()}/stream`,
    result: doc.result,
    createdAt: doc.createdAt,
  });
};

exports.getMyHistory = async (req, res) => {
  const userId = req.user.id;

  const items = await Video.find({ userId })
    .sort({ createdAt: -1 })
    .select("-__v");

  return res.json({ items });
};

// Protected stream for the logged-in user (by Video document ID)
exports.streamVideoById = async (req, res) => {
  const userId = req.user.id;
  const videoDocId = req.params.id;

  const doc = await Video.findOne({ _id: videoDocId, userId });
  if (!doc) return res.status(404).json({ message: "Video not found." });

  const bucket = getBucket();

  res.set("Content-Type", doc.mimeType || "video/mp4");

  const downloadStream = bucket.openDownloadStream(doc.gridFsId);
  downloadStream.on("error", () => res.status(404).end());
  downloadStream.pipe(res);
};
