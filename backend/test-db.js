import dns from "dns";
import mongoose from "mongoose";
import dotenv from "dotenv";

dns.setServers(["8.8.8.8", "8.8.4.4"]);

dotenv.config();

console.log("MONGODB_URI loaded:", Boolean(process.env.MONGODB_URI));

try {
  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 15000,
    tls: true,
  });

  console.log("✅ MongoDB connection SUCCESSFUL");

  await mongoose.disconnect();
  process.exit(0);
} catch (error) {
  console.log("\n❌ CONNECTION FAILED");
  console.log("Name:", error.name);
  console.log("Message:", error.message);

  if (error.reason?.servers) {
    console.log("\n--- SERVER ERRORS ---");

    for (const [address, server] of error.reason.servers) {
      console.log("\nServer:", address);
      console.log("Type:", server.type);
      console.log("Error:", server.error?.message || "No error message");
    }
  }

  process.exit(1);
}