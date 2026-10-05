import dns from "dns";

dns.setServers(["8.8.8.8", "8.8.4.4"]);

import speechRoutes from "./routes/speechRoutes.js";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import newsRoutes from "./routes/newsRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import { connectDatabase, isDatabaseConnected } from "./config/database.js";

dotenv.config();

connectDatabase().catch((error) =>
  console.error("MongoDB connection failed:", error.message)
);

const app = express();

app.set("trust proxy", 1);
app.disable("x-powered-by");

app.use((req, res, next) => {
  res.set({
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
    "Cache-Control": "no-store",
  });

  next();
});



// Middleware
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:8080",
  "http://localhost:4173",
  ...(process.env.FRONTEND_ORIGINS || process.env.FRONTEND_URL || "").split(",").map((origin) => origin.trim()),
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    // Allow local development only outside production.
    if (process.env.NODE_ENV !== "production" && (origin.includes("localhost") || origin.includes("127.0.0.1"))) return callback(null, true);
    // Allow configured allowed origins
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error("Origin not allowed"));
  },
  credentials: true,
}));
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

// Route Attachments
app.use("/api/auth", authRoutes);
app.use("/api/news", newsRoutes);
app.use("/api/speech", speechRoutes);

// Health Check Route
app.get("/api/health", (req, res) => {
  const healthy = isDatabaseConnected();
  res.status(healthy ? 200 : 503).json({
    status: healthy ? "ok" : "degraded",
    service: "AI News Summarizer Backend",
    timestamp: new Date().toISOString(),
  });
});

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "🚀 AI News Summarizer Backend REST API is active!",
    version: "2.0.0",
    endpoints: {
      health: "/api/health",
      auth: "/api/auth",
      news: "/api/news",
    },
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Unhandled Global Error:", err);
  if (err.message === "Origin not allowed") {
    return res.status(403).json({ success: false, message: "Request not allowed." });
  }
  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`\n=================================================`);
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
  console.log(`🔑 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`=================================================\n`);
});
