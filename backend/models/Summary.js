import mongoose from "mongoose";

const summarySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    userEmail: { type: String, required: true, maxlength: 254 },
    title: { type: String, required: true, maxlength: 300 },
    url: { type: String, default: null, maxlength: 2048 },
    originalText: { type: String, default: "", maxlength: 500 },
    summary: { type: String, required: true, maxlength: 20000 },
    keyPoints: { type: [String], default: [] },
    sentiment: { type: String, default: "neutral", maxlength: 32 },
    category: { type: String, default: "general", maxlength: 64 },
    language: { type: String, default: "en", maxlength: 16 },
  },
  { timestamps: true, versionKey: false },
);

summarySchema.index({ userId: 1, createdAt: -1 });
export const Summary = mongoose.models.Summary || mongoose.model("Summary", summarySchema);
