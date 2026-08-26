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
    // RESUME FILE
    // =====================================================
    // The uploaded file itself lives on disk (backend/uploads/resumes);
    // this just records where to find it and its original name so the
    // parser (or a future API wrapping parser.py) can locate it later.

    resume: {
      originalName: { type: String, required: true },
      storedFilename: { type: String, required: true },
      path: { type: String, required: true },
      mimeType: { type: String, required: true },
      sizeBytes: { type: Number, required: true },
    },

    // =====================================================
    // LINK TO A LOGGED-IN USER, IF ANY
    // =====================================================

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CareerProfile", careerProfileSchema);