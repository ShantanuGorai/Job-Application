const express = require("express");
const WebsiteRequest = require("../models/WebsiteRequest");

const router = express.Router();


// =====================================================
// CREATE A WEBSITE REQUEST (Get Started form submission)
// =====================================================

router.post("/", async (req, res) => {
  try {

    const {
      fullName,
      email,
      company,
      profession,
      industry,
      primaryGoal,
      targetAudience,
      designStyle,
      inspirationWebsites,
      budgetRange,
      timeline,
      features,
      additionalInfo,
    } = req.body;


    // -------------------------------------------------
    // VALIDATION — mirrors the required fields on the
    // frontend so the API can't be used to save garbage
    // even if someone bypasses the UI.
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

    if (!profession || !industry) {
      return res.status(400).json({
        success: false,
        message: "Profession and industry are required",
      });
    }

    if (!primaryGoal) {
      return res.status(400).json({
        success: false,
        message: "Please select a primary website goal",
      });
    }

    if (!designStyle) {
      return res.status(400).json({
        success: false,
        message: "Please select a design style",
      });
    }

    if (!budgetRange || !timeline) {
      return res.status(400).json({
        success: false,
        message: "Budget range and timeline are required",
      });
    }


    // -------------------------------------------------
    // SAVE
    // -------------------------------------------------

    const websiteRequest = await WebsiteRequest.create({
      fullName,
      email: email.toLowerCase().trim(),
      company,
      profession,
      industry,
      primaryGoal,
      targetAudience,
      designStyle,
      inspirationWebsites,
      budgetRange,
      timeline,
      features,
      additionalInfo,
      // Attach the logged-in user's id if there's an active session
      user: req.isAuthenticated?.() ? req.user._id : null,
    });


    return res.status(201).json({
      success: true,
      message: "Your request has been submitted",
      id: websiteRequest._id,
    });

  } catch (error) {

    console.error("Website request submission error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while saving your request",
    });
  }
});


module.exports = router;