// backend/src/config/db.js
import mongoose from "mongoose";

mongoose.set("strictQuery", true);

export default async function connectDB(uri = process.env.MONGO_URI) {
  if (!uri) throw new Error("MONGO_URI is not set. Add it to backend/.env");
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  console.log(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
  return mongoose.connection;
}
