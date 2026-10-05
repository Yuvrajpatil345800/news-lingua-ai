import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },

    // Required for local accounts.
    // OAuth accounts receive a random unusable password hash.
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },

    username: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      maxlength: 32,
    },

    displayName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },

    bio: {
      type: String,
      default: "",
      maxlength: 500,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    // Authentication provider
    authProvider: {
      type: String,
      enum: ["local", "google", "microsoft"],
      default: "local",
      index: true,
    },

    // Provider-specific immutable identifiers
    googleId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },

    microsoftId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },

    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const User =
  mongoose.models.User || mongoose.model("User", userSchema);