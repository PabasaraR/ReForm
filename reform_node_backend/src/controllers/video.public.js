// controllers/video.public.js

const mongoose = require("mongoose");
const { getBucket } = require("../config/gridfs");

exports.publicStream = async (req, res) => {
  const bucket = getBucket();
  const id = req.params.gridFsId;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).end();
  }

  res.set("Content-Type", "video/mp4");

  const stream = bucket.openDownloadStream(new mongoose.Types.ObjectId(id));
  stream.on("error", () => res.status(404).end());
  stream.pipe(res);
};
