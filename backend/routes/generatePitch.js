const express = require("express");
const CareerProfile = require("../models/CareerProfile");
const ParsedResume = require("../models/ParsedResume");

const router = express.Router();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

function requireAuth(req, res, next) {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ success: false, message: "Not logged in" });
  }
  next();
}


// =====================================================
// SCRAPE THE JOB DESCRIPTION TEXT FROM A LIVE POSTING
// =====================================================

async function scrapeJobDescription(jobUrl) {
  if (!jobUrl) return "";

  try {
    const response = await fetch(jobUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) return "";

    const html = await response.text();
    const cheerio = require("cheerio");
    const $ = cheerio.load(html);

    const selectors = [
      ".show-more-less-html__markup",
      ".description__text",
      "[class*='description']",
    ];

    for (const selector of selectors) {
      const text = $(selector).first().text().trim();
      if (text.length > 100) {
        return text.replace(/\s+/g, " ").slice(0, 4000);
      }
    }

    return "";
  } catch (error) {
    console.error("JD scrape failed (continuing without it):", error.message);
    return "";
  }
}


// =====================================================
// CALL THE GEMINI API
// =====================================================

async function callGemini(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    const message = data?.error?.message || `Gemini API error (${response.status})`;
    throw new Error(message);
  }

  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    const blockReason = data?.promptFeedback?.blockReason;
    throw new Error(
      blockReason
        ? `Gemini declined to respond (reason: ${blockReason}). Try a different job posting.`
        : "No text returned by Gemini."
    );
  }

  return text.trim();
}


// =====================================================
// POST /api/generate-pitch
// =====================================================

router.post("/", requireAuth, async (req, res) => {
  if (!GEMINI_API_KEY) {
    return res.status(500).json({
      success: false,
      message:
        "AI pitch generation isn't configured yet — add GEMINI_API_KEY to backend/.env " +
        "(get a free one at aistudio.google.com/apikey) and restart the backend.",
    });
  }

  try {
    const { jobUrl, jobTitle, company } = req.body;

    if (!jobUrl || !jobTitle) {
      return res.status(400).json({
        success: false,
        message: "jobUrl and jobTitle are required",
      });
    }

    const [profile, resume] = await Promise.all([
      CareerProfile.findOne({ user: req.user._id }).sort({ createdAt: -1 }),
      ParsedResume.findOne({ user: req.user._id }).sort({ createdAt: -1 }),
    ]);

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Complete your profile first so we know what to pitch.",
      });
    }

    const skills = resume?.skills?.length ? resume.skills : [];
    const candidateName = profile.fullName || "the candidate";
    const experienceLevel = profile.experienceLevel || "";

    const jobDescription = await scrapeJobDescription(jobUrl);

    // IMPORTANT: the pitch is always written for THIS specific job
    // (jobTitle, from whichever card was clicked) — never for the
    // resume's own predicted role. A candidate's resume might be
    // ML-flavored while they're deliberately pitching for an HR
    // role (or vice versa); the job actually being applied to must
    // win, with skills used only as supporting evidence of fit.
    const prompt = `Write a short, genuine, specific paragraph (120-160 words) that ${candidateName} could paste into a cover letter or a LinkedIn "Easy Apply" note explaining why they're a strong fit for the JOB described below — NOT for any other role. Do not use generic filler phrases like "I am excited to apply" or "I believe I would be a great fit." Only reference skills/experience from the candidate's background that are actually relevant to THIS job; do not center the pitch on unrelated skills just because they're the candidate's strongest ones. Write in first person, as if ${candidateName} is speaking.

JOB (write the pitch for this exact role):
- Title: ${jobTitle}
- Company: ${company || "the company"}
${jobDescription ? `- Job description: ${jobDescription}` : "- (No job description could be retrieved — write generally about the role/title/company instead.)"}

CANDIDATE'S BACKGROUND (use only what's relevant to the job above):
- Experience level: ${experienceLevel}
- Skills: ${skills.join(", ") || "not specified"}

Output ONLY the paragraph itself, no preamble, no headers, no quotation marks around it.`;

    const pitch = await callGemini(prompt);

    return res.status(200).json({
      success: true,
      pitch,
      usedJobDescription: jobDescription.length > 0,
    });
  } catch (error) {
    console.error("Pitch generation error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Could not generate a pitch right now. Please try again.",
    });
  }
});

module.exports = router;