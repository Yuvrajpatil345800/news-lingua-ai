import dns from "dns";
import mongoose from "mongoose";
import dotenv from "dotenv";

// Use reliable public DNS servers for MongoDB Atlas SRV resolution.
dns.setServers(["8.8.8.8", "8.8.4.4"]);

dotenv.config({
  path: [".env", ".env.local", "../.env.local"],
});

const mongoUri = process.env.MONGODB_URI || "";
let reconnectTimer = null;
let reconnectAttempts = 0;

const scheduleReconnect = () => {
  if (!mongoUri || reconnectTimer || mongoose.connection.readyState === 1) {
    return;
  }

  const delay = Math.min(30_000, 1_000 * 2 ** reconnectAttempts);
  reconnectAttempts += 1;

  console.warn(`MongoDB unavailable. Retrying in ${Math.round(delay / 1000)} seconds...`);
  reconnectTimer = setTimeout(async () => {
    reconnectTimer = null;
    await connectDatabase();
  }, delay);
};

export const isDatabaseConfigured = Boolean(mongoUri);

export const connectDatabase = async () => {
  if (!mongoUri) {
    console.warn(
      "MONGODB_URI is not configured; authentication endpoints are unavailable."
    );
    return false;
  }

  if (mongoose.connection.readyState === 1) {
    return true;
  }

  if (mongoose.connection.readyState === 2) {
    return false;
  }

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
    });

    reconnectAttempts = 0;
    console.log("MongoDB connected.");
    return true;
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    scheduleReconnect();
    return false;
  }
};

mongoose.connection.on("disconnected", () => {
  console.warn("MongoDB disconnected.");
  scheduleReconnect();
});

export const isDatabaseConnected = () => {
  return mongoose.connection.readyState === 1;
};
