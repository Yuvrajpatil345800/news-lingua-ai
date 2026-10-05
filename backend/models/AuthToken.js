import mongoose from "mongoose";

const authTokenSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    type: { type: String, required: true, enum: ["email-verification", "password-reset"] },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { timestamps: true, versionKey: false },
);

export const AuthToken = mongoose.models.AuthToken || mongoose.model("AuthToken", authTokenSchema);
