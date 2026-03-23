const { MongoClient, GridFSBucket } = require("mongodb");

let bucket = null;

// function to initialize GridFS
async function initGridFS() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("MONGO_URI missing in .env");

  // Create a separate MongoClient 
  const client = new MongoClient(uri);

  await client.connect();

  // get database name from .env or URI or use default
  const dbName =
    process.env.MONGO_DB_NAME || client.db().databaseName || "reform_db";

  const db = client.db(dbName);

  // This creates a bucket object; collections are created on first upload
  bucket = new GridFSBucket(db, { bucketName: "videos" });

  console.log("GridFS initialized (bucketName=videos)");
}

// function to get bucket object
function getBucket() {
  if (!bucket) throw new Error("GridFS not initialized. Call initGridFS() first.");
  return bucket;
}

module.exports = { initGridFS, getBucket };
