const mongoose = require("mongoose");

const careerProfileSchema = new mongoose.Schema(
  {
    // =====================================================
    // PERSONAL INFO
    // =====================================================

    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, trim: true, default: "" },

    // =====================================================
    // PROFESSIONAL
    // =====================================================

    jobTitle: { type: String, required: true, trim: true },
    industry: { type: String, required: true },

    // =====================================================
    // CAREER GOALS
    // =====================================================

    careerGoal: { type: String, required: true },
    idealRole: { type: String, trim: true, default: "" },

    // =====================================================
    // EXPERIENCE & SKILLS
    // =====================================================

    experienceLevel: { type: String, required: true },
    skills: { type: String, trim: true, default: "" },

    // =====================================================
    // COMPENSATION & AVAILABILITY
    // =====================================================

    salaryRange: { type: String, required: true },
    availability: { type: String, required: true },

    // =====================================================
    // WORK PREFERENCES
    // =====================================================

    workPreferences: { type: [String], default: [] },
    additionalInfo: { type: String, trim: true, default: "" },

    // =====================================================
    // LINK TO A LOGGED-IN USER, IF ANY
    // =====================================================
    // Note: no resume field here anymore — resume upload now
    // happens once, on the dashboard, right before running
    // the parser (see routes/parseResume.js), instead of
    // being collected (and required) during onboarding too.

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

// Export the compiled MODEL, not the schema — mongoose.model(...)
// is what gives you .find(), .findOne(), .create(), etc.
module.exports =
  mongoose.models.CareerProfile || mongoose.model("CareerProfile", careerProfileSchema);