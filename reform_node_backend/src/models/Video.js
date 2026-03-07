// models/Video.js

const mongoose = require("mongoose");

const videoSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    exercise: { type: String, required: true }, // bicep_curl | shoulder_press

    // GridFS file id
    gridFsId: { type: mongoose.Schema.Types.ObjectId, required: true },

    originalName: { type: String, default: "" },
    mimeType: { type: String, default: "" },
    sizeBytes: { type: Number, default: 0 },

    result: {
      label: { type: String, default: "" },
      bad_ratio: { type: Number, default: null },
      feedback: { type: String, default: "" },
      continuous_frames_before: { type: [[Number]], default: [] },
      continuous_frames_after: { type: [[Number]], default: [] },
      raw: { type: Object, default: {} },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Video", videoSchema); 
