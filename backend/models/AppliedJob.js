const mongoose = require("mongoose");

const appliedJobSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    platform: { type: String, required: true },
    role: { type: String, required: true },
    company: { type: String, default: "" },
    location: { type: String, default: "" },
    url: { type: String, required: true },

    
    linkType: {
      type: String,
      enum: ["live", "gateway"],
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AppliedJob", appliedJobSchema);