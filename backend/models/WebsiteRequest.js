const mongoose = require("mongoose");

const websiteRequestSchema = new mongoose.Schema(
  {
    // =====================================================
    // PERSONAL INFO
    // =====================================================

    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    company: {
      type: String,
      trim: true,
      default: "",
    },

    // =====================================================
    // PROFESSIONAL
    // =====================================================

    profession: {
      type: String,
      required: true,
      trim: true,
    },

    industry: {
      type: String,
      required: true,
    },

    // =====================================================
    // WEBSITE GOALS
    // =====================================================

    primaryGoal: {
      type: String,
      required: true,
    },

    targetAudience: {
      type: String,
      trim: true,
      default: "",
    },

    // =====================================================
    // DESIGN
    // =====================================================

    designStyle: {
      type: String,
      required: true,
    },

    inspirationWebsites: {
      type: String,
      trim: true,
      default: "",
    },

    // =====================================================
    // BUDGET & TIMELINE
    // =====================================================

    budgetRange: {
      type: String,
      required: true,
    },

    timeline: {
      type: String,
      required: true,
    },

    // =====================================================
    // REQUIREMENTS
    // =====================================================

    features: {
      type: [String],
      default: [],
    },

    additionalInfo: {
      type: String,
      trim: true,
      default: "",
    },

    // =====================================================
    // LINK TO A LOGGED-IN USER, IF ANY
    // =====================================================
    // The form is public (no login required), but if the
    // visitor happens to be logged in when they submit, we
    // record which account it came from.

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("WebsiteRequest", websiteRequestSchema);