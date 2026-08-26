const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const CareerProfile = require("../models/CareerProfile");

const router = express.Router();


// =====================================================
// STORAGE CONFIG
// =====================================================
// Resumes are saved to backend/uploads/resumes with a
// timestamp-prefixed filename so two people uploading
// "resume.pdf" never collide.

const uploadDir = path.join(__dirname, "..", "uploads", "resumes");

fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const safeOriginalName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    cb(null, `${Date.now()}-${safeOriginalName}`);
  },
});

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF, DOC, or DOCX files are allowed"));
    }
  },
});


// =====================================================
// CREATE A CAREER PROFILE (onboarding form submission)
// =====================================================

router.post("/", (req, res) => {

  upload.single("resume")(req, res, async (uploadError) => {

    if (uploadError) {
      return res.status(400).json({
        success: false,
        message: uploadError.message || "Resume upload failed",
      });
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

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "A resume file is required",
        });
      }


      // -------------------------------------------------
      // PARSE THE workPreferences JSON STRING
      // -------------------------------------------------

      let parsedWorkPreferences = [];

      try {
        parsedWorkPreferences = workPreferences ? JSON.parse(workPreferences) : [];
      } catch {
        parsedWorkPreferences = [];
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
        workPreferences: parsedWorkPreferences,
        additionalInfo,
        resume: {
          originalName: req.file.originalname,
          storedFilename: req.file.filename,
          path: req.file.path,
          mimeType: req.file.mimetype,
          sizeBytes: req.file.size,
        },
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
});


module.exports = router;