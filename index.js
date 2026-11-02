require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");

const app = express();

const PORT = process.env.PORT || 5000;
// Comma-separated list of allowed origins (e.g. "http://localhost:3000,https://<frontend>.vercel.app")
const CORS_ORIGINS = (process.env.CLIENT_URL || "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);

app.use(
  cors({
    origin: CORS_ORIGINS.length === 1 ? CORS_ORIGINS[0] : CORS_ORIGINS,
    credentials: true,
  }),
);

app.use(express.json());

// MongoDB connection (cached across warm invocations on Vercel)
const client = new MongoClient(process.env.MONGODB_URI);
let dbPromise = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = client
      .connect()
      .then(() => {
        console.log("MongoDB Connected Successfully!");
        return client.db(process.env.DB_NAME || "cat-hermione");
      })
      .catch((error) => {
        dbPromise = null;
        throw error;
      });
  }
  return dbPromise;
}

// Root route
app.get("/", (req, res) => {
  res.send("Cat-Hermione Server is Running!");
});

// Health check route
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Cat-Hermione API is healthy!",
  });
});

// Ensure DB is connected for routes that use req.app.locals.db
app.use("/api/events", async (req, res, next) => {
  try {
    req.app.locals.db = await getDb();
    next();
  } catch (error) {
    console.error("Database connection failed:", error.message);
    res.status(500).json({
      success: false,
      message: "Database connection failed.",
    });
  }
});

// Events routes
const eventsRoutes = require("./routes/events");
app.use("/api/events", eventsRoutes);

// Vercel serverless: export the app instead of listening.
// Local development (`npm start`) still starts a server.
async function startServer() {
  try {
    await getDb();

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
}

if (!process.env.VERCEL) {
  startServer();
}

module.exports = app;
