require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");

const app = express();

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  }),
);

app.use(express.json());

// MongoDB connection
const client = new MongoClient(process.env.MONGODB_URI);

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

// Events routes
const eventsRoutes = require("./routes/events");
app.use("/api/events", eventsRoutes);

// Start server
async function startServer() {
  try {
    await client.connect();

    const db = client.db(process.env.DB_NAME || "cat-hermione");

    app.locals.db = db;

    console.log("MongoDB Connected Successfully!");

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
}

startServer();
