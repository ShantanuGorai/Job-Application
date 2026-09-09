const mongoose = require("mongoose");

const careerProfileSchema = new mongoose.Schema(
  {

    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, trim: true, default: "" },


    jobTitle: { type: String, required: true, trim: true },
    industry: { type: String, required: true },

    careerGoal: { type: String, required: true },
    idealRole: { type: String, trim: true, default: "" },


    experienceLevel: { type: String, required: true },
    skills: { type: String, trim: true, default: "" },


    salaryRange: { type: String, required: true },
    availability: { type: String, required: true },

    workPreferences: { type: [String], default: [] },
    additionalInfo: { type: String, trim: true, default: "" },

    

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.CareerProfile || mongoose.model("CareerProfile", careerProfileSchema);