const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");
const ParsedResume = require("../models/ParsedResume");

const router = express.Router();


function requireAuth(req, res, next) {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ success: false, message: "Not logged in" });
  }
  next();
}



const tempDir = path.join(__dirname, "..", "uploads", "parse-temp");
fs.mkdirSync(tempDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, tempDir),
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    cb(null, `${Date.now()}-${safeName}`);
  },
});

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, 
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF, DOC, DOCX, or TXT files are allowed"));
    }
  },
});


const EXPERIENCE_BUCKET_TO_MONTHS = {
  "Entry Level (0-2 years)": 12,
  "Mid Level (3-5 years)": 48,
  "Senior Level (6-10 years)": 96,
  "Executive/Leadership (10+ years)": 150,
};



function diagnoseFailure({ pythonBin, stderr, exitCode }) {
  if (stderr.includes("ModuleNotFoundError") || stderr.includes("ImportError")) {
    const match = stderr.match(/No module named '([^']+)'/);
    const moduleName = match ? match[1] : "a required package";
    return (
      `Missing Python package: ${moduleName}. From the project root, run ` +
      `"pip install -r requirements.txt" and restart the backend.`
    );
  }

  if (stderr.includes("Can't find model") || stderr.includes("en_core_web_sm")) {
    return (
      `The spaCy language model isn't installed. Run ` +
      `"python -m spacy download en_core_web_sm" and restart the backend.`
    );
  }

  const stderrTail = stderr.trim().split("\n").filter(Boolean).slice(-8).join("\n");

  if (stderrTail) {
    return `Resume parser failed (exit code ${exitCode}). Details:\n${stderrTail}`;
  }

  return (
    `Resume parser (${pythonBin}) exited with code ${exitCode} and produced no ` +
    `error output. Check the backend console for more detail.`
  );
}


router.post("/", requireAuth, (req, res) => {

  upload.single("resume")(req, res, async (uploadError) => {

    if (uploadError) {
      return res.status(400).json({
        success: false,
        message: uploadError.message || "Resume upload failed",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "A resume file is required",
      });
    }

    const resumePath = req.file.path;

    const preferredRole = (req.body.preferredRole || "").trim();
    const experienceBucket = (req.body.experienceLevel || "").trim();
    const location = (req.body.location || "India").trim() || "India";

    const experienceMonths = EXPERIENCE_BUCKET_TO_MONTHS[experienceBucket] ?? 0;

    const repoRoot = path.join(__dirname, "..");
    const pythonBin = process.env.PYTHON_BIN || "python3";

    const args = [
      "parser.py",
      "--api",
      resumePath,
      "--role",
      preferredRole,
      "--experience-months",
      String(experienceMonths),
      "--location",
      location,
    ];

    const child = spawn(pythonBin, args, { cwd: repoRoot });

    let stdout = "";
    let stderr = "";

    const TIMEOUT_MS = 90_000;
    const timeout = setTimeout(() => {
      child.kill("SIGKILL");
    }, TIMEOUT_MS);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("close", async (code) => {
      clearTimeout(timeout);

      fs.unlink(resumePath, () => {});

      if (stderr) {
        console.error(`[parser.py stderr]\n${stderr}`);
      }

      if (code !== 0) {
        return res.status(500).json({
          success: false,
          message: diagnoseFailure({ pythonBin, stderr, exitCode: code }),
        });
      }


      const lines = stdout.split("\n").map((l) => l.trim()).filter(Boolean);
      const lastLine = lines[lines.length - 1];

      let result;
      try {
        result = JSON.parse(lastLine || "{}");
      } catch (parseError) {
        console.error("Could not parse parser.py output. Full stdout:\n", stdout);
        return res.status(500).json({
          success: false,
          message:
            "Resume parser returned an unexpected response. Check the backend " +
            "console — the raw output from parser.py was logged there.",
        });
      }

      if (result.error) {
        return res.status(400).json({
          success: false,
          message: result.error,
        });
      }

      try {
        await ParsedResume.findOneAndUpdate(
          { user: req.user._id },
          {
            user: req.user._id,
            candidate_name: result.candidate_name,
            skills: result.skills,
            predicted_role: result.predicted_role,
            preferred_role: result.preferred_role,
            experience_months: result.experience_months,
            location: result.location,
            resume_score: result.resume_score,
            resume_score_notes: result.resume_score_notes,
            recommended_skills: result.recommended_skills,
            preferred_recommended_skills: result.preferred_recommended_skills,
            resume_matches: result.resume_matches,
            preferred_matches: result.preferred_matches,
            raw_text: result.raw_text,
            contact_info: result.contact_info,
            education: result.education,
            experience: result.experience,
            projects: result.projects,
 
          },
          { upsert: true, new: true }
        );
      } catch (saveError) {

        console.error("Could not save parsed resume:", saveError);
      }

      return res.status(200).json({
        success: true,
        data: result,
      });
    });

    child.on("error", (err) => {
      clearTimeout(timeout);
      fs.unlink(resumePath, () => {});

      console.error("Failed to start parser.py:", err);

      const message =
        err.code === "ENOENT"
          ? `Couldn't find the "${pythonBin}" command on this server. Set PYTHON_BIN in ` +
            `backend/.env to your actual Python executable (e.g. PYTHON_BIN=python3.11, or ` +
            `PYTHON_BIN=python on Windows), then restart the backend.`
          : `Could not start the resume parser: ${err.message}`;

      return res.status(500).json({
        success: false,
        message,
      });
    });
  });
});



router.get("/latest", requireAuth, async (req, res) => {
  try {
    const saved = await ParsedResume.findOne({ user: req.user._id });
    return res.status(200).json({ success: true, data: saved || null });
  } catch (error) {
    console.error("Could not load saved resume analysis:", error);
    return res.status(500).json({ success: false, message: "Could not load your saved resume" });
  }
});


module.exports = router;