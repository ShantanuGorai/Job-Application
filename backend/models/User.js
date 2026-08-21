const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // =====================================================
    // BASIC USER DETAILS
    // =====================================================

    name: {
      type: String,
      trim: true,
      default: null,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
    },

    password: {
      type: String,
      default: null,
    },

    // =====================================================
    // OAUTH DETAILS
    // =====================================================

    githubId: {
      type: String,
      default: null,
    },

    provider: {
      type: String,
      enum: ["local", "google", "github"],
      default: "local",
    },

    avatar: {
      type: String,
      default: null,
    },

    // =====================================================
    // EMAIL VERIFICATION
    // =====================================================

    emailVerified: {
      type: Boolean,
      default: false,
    },

    verificationOTP: {
      type: String,
      default: null,
    },

    verificationOTPExpires: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);