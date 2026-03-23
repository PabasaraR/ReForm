require("dotenv").config()
const app = require("./app")
const connectDB = require("./config/db")
const { initGridFS } = require("./config/gridfs")

const PORT = process.env.PORT || 8000

async function start() {
  try {
    await connectDB()
    await initGridFS()

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`)
    })
  } catch (err) {
    console.error("Failed to start server", err)
    process.exit(1)
  }
}

start()