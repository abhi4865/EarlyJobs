// backend/src/app.js
import cors from "cors";
import express from "express";
import helmet from "helmet";
import mongoose from "mongoose";
import morgan from "morgan";
import { errorHandler, notFound } from "./middleware/error.js";
import routes from "./routes/index.js";

const app = express();

const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

// Reuse one connection across requests (serverless-friendly)
let connectionPromise = null;
async function ensureDb() {
  if (mongoose.connection.readyState === 1) return;
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI is not set");
  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 8000 })
      .catch((err) => {
        connectionPromise = null; // allow retry on next request
        throw err;
      });
  }
  await connectionPromise;
}

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      callback(null, false);
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));
if (process.env.NODE_ENV !== "production") app.use(morgan("dev"));

// Connect to MongoDB before any route runs
app.use(async (req, res, next) => {
  try {
    await ensureDb();
    next();
  } catch (err) {
    console.error("DB connection failed:", err.message);
    next(err);
  }
});

app.use("/api", routes);

app.use(notFound);
app.use(errorHandler);

export default app;