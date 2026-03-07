const { MongoClient, GridFSBucket } = require("mongodb");

let bucket = null;

async function initGridFS() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("MONGO_URI missing in .env");

  // Create a separate MongoClient (simple + stable)
  const client = new MongoClient(uri);

  await client.connect();

  // Use database from URI, or set one here
  const dbName =
    process.env.MONGO_DB_NAME || client.db().databaseName || "reform_db";

  const db = client.db(dbName);

  // This creates a bucket object; collections are created on first upload
  bucket = new GridFSBucket(db, { bucketName: "videos" });

  console.log("✅ GridFS initialized (bucketName=videos)");
}

function getBucket() {
  if (!bucket) throw new Error("GridFS not initialized. Call initGridFS() first.");
  return bucket;
}

module.exports = { initGridFS, getBucket };
