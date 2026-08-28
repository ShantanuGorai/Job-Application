const express = require("express");
const AppliedJob = require("../models/AppliedJob");

const router = express.Router();


function requireAuth(req, res, next) {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ success: false, message: "Not logged in" });
  }
  next();
}


// =====================================================
// RECORD A CLICK ("Apply" / "Search" was pressed)
// =====================================================

router.post("/", requireAuth, async (req, res) => {
  try {
    const { platform, role, company, location, url, linkType } = req.body;

    if (!platform || !role || !url || !linkType) {
      return res.status(400).json({
        success: false,
        message: "platform, role, url, and linkType are required",
      });
    }

    const appliedJob = await AppliedJob.create({
      user: req.user._id,
      platform,
      role,
      company: company || "",
      location: location || "",
      url,
      linkType,
    });

    return res.status(201).json({ success: true, id: appliedJob._id });
  } catch (error) {
    console.error("Applied job tracking error:", error);
    return res.status(500).json({ success: false, message: "Could not record this" });
  }
});


// =====================================================
// LIST THE CURRENT USER'S APPLIED JOBS (newest first)
// =====================================================

router.get("/", requireAuth, async (req, res) => {
  try {
    const jobs = await AppliedJob.find({ user: req.user._id }).sort({ createdAt: -1 });

    return res.status(200).json({ success: true, jobs });
  } catch (error) {
    console.error("Applied job list error:", error);
    return res.status(500).json({ success: false, message: "Could not load applied jobs" });
  }
});


module.exports = router;