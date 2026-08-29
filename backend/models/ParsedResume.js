const mongoose = require("mongoose");

// One saved parse result per user — re-uploading a resume
// overwrites the previous one (see the upsert in
// routes/parseResume.js), so this always reflects the
// user's MOST RECENT resume analysis, and survives a
// page refresh without re-uploading anything.
const parsedResumeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    candidate_name: { type: String, default: "" },
    skills: { type: [String], default: [] },
    predicted_role: { type: String, default: "" },
    preferred_role: { type: String, default: null },
    experience_months: { type: Number, default: 0 },
    location: { type: String, default: "India" },

    resume_score: { type: Number, default: 0 },
    resume_score_notes: { type: [String], default: [] },

    // Stored as-is (Mixed) since these are nested job-result
    // shapes from parser.py, not something this app needs to
    // query into individually.
    resume_matches: { type: mongoose.Schema.Types.Mixed, default: {} },
    preferred_matches: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.ParsedResume || mongoose.model("ParsedResume", parsedResumeSchema);