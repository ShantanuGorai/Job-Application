const express = require("express");
const CareerProfile = require("../models/CareerProfile");

const router = express.Router();


// =====================================================
// CREATE A CAREER PROFILE (onboarding form submission)
// =====================================================
// No file upload here anymore — resume upload happens
// once, on the dashboard, right before running the parser.
// This route just saves the plain form answers as JSON.

router.post("/", async (req, res) => {
  try {

    const {
      fullName,
      email,
      phone,
      jobTitle,
      industry,
      careerGoal,
      idealRole,
      experienceLevel,
      skills,
      salaryRange,
      availability,
      workPreferences,
      additionalInfo,
    } = req.body;


    // -------------------------------------------------
    // VALIDATION
    // -------------------------------------------------

    if (!fullName || !email) {
      return res.status(400).json({
        success: false,
        message: "Full name and email are required",
      });
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
      });
    }

    if (!jobTitle || !industry) {
      return res.status(400).json({
        success: false,
        message: "Job title and industry are required",
      });
    }

    if (!careerGoal) {
      return res.status(400).json({
        success: false,
        message: "Please select a primary career goal",
      });
    }

    if (!experienceLevel) {
      return res.status(400).json({
        success: false,
        message: "Please select your experience level",
      });
    }

    if (!salaryRange || !availability) {
      return res.status(400).json({
        success: false,
        message: "Salary range and availability are required",
      });
    }


    // -------------------------------------------------
    // SAVE
    // -------------------------------------------------

    const careerProfile = await CareerProfile.create({
      fullName,
      email: email.toLowerCase().trim(),
      phone,
      jobTitle,
      industry,
      careerGoal,
      idealRole,
      experienceLevel,
      skills,
      salaryRange,
      availability,
      workPreferences: Array.isArray(workPreferences) ? workPreferences : [],
      additionalInfo,
      user: req.isAuthenticated?.() ? req.user._id : null,
    });


    return res.status(201).json({
      success: true,
      message: "Your profile has been submitted",
      id: careerProfile._id,
    });

  } catch (error) {

    console.error("Career profile submission error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while saving your profile",
    });
  }
});


// =====================================================
// GET THE CURRENT USER'S MOST RECENT CAREER PROFILE
// =====================================================
// Used to check whether someone has already completed
// onboarding (so the form isn't shown again) and to
// pre-fill the resume parser's role/experience inputs.

router.get("/me", async (req, res) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ success: false, message: "Not logged in" });
  }

  try {
    const profile = await CareerProfile.findOne({ user: req.user._id }).sort({
      createdAt: -1,
    });

    return res.status(200).json({ success: true, profile: profile || null });
  } catch (error) {
    console.error("Career profile fetch error:", error);
    return res.status(500).json({ success: false, message: "Could not load your profile" });
  }
});


// =====================================================
// UPDATE THE CURRENT USER'S CAREER PROFILE
// =====================================================
// Used by the Account page — edits the existing profile
// in place instead of creating a new onboarding submission.

router.put("/me", async (req, res) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ success: false, message: "Not logged in" });
  }

  try {

    const {
      fullName,
      email,
      phone,
      jobTitle,
      industry,
      careerGoal,
      idealRole,
      experienceLevel,
      skills,
      salaryRange,
      availability,
      workPreferences,
      additionalInfo,
    } = req.body;


    // -------------------------------------------------
    // VALIDATION — same rules as the initial submission
    // -------------------------------------------------

    if (!fullName || !email) {
      return res.status(400).json({
        success: false,
        message: "Full name and email are required",
      });
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
      });
    }

    if (!jobTitle || !industry) {
      return res.status(400).json({
        success: false,
        message: "Job title and industry are required",
      });
    }

    if (!careerGoal) {
      return res.status(400).json({
        success: false,
        message: "Please select a primary career goal",
      });
    }

    if (!experienceLevel) {
      return res.status(400).json({
        success: false,
        message: "Please select your experience level",
      });
    }

    if (!salaryRange || !availability) {
      return res.status(400).json({
        success: false,
        message: "Salary range and availability are required",
      });
    }


    // -------------------------------------------------
    // FIND AND UPDATE IN PLACE
    // -------------------------------------------------

    const existing = await CareerProfile.findOne({ user: req.user._id }).sort({
      createdAt: -1,
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "No profile found. Please complete onboarding first.",
      });
    }

    existing.fullName = fullName;
    existing.email = email.toLowerCase().trim();
    existing.phone = phone;
    existing.jobTitle = jobTitle;
    existing.industry = industry;
    existing.careerGoal = careerGoal;
    existing.idealRole = idealRole;
    existing.experienceLevel = experienceLevel;
    existing.skills = skills;
    existing.salaryRange = salaryRange;
    existing.availability = availability;
    existing.workPreferences = Array.isArray(workPreferences) ? workPreferences : [];
    existing.additionalInfo = additionalInfo;

    await existing.save();

    return res.status(200).json({
      success: true,
      message: "Your profile has been updated",
      profile: existing,
    });

  } catch (error) {

    console.error("Career profile update error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while updating your profile",
    });
  }
});


module.exports = router;