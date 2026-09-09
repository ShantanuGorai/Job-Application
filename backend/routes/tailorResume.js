const express = require("express");
const cheerio = require("cheerio");
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
    const $ = cheerio.load(html);

    const selectors = [
      ".show-more-less-html__markup",
      ".description__text",
      "[class*='description']",
    ];

    for (const selector of selectors) {
      const text = $(selector).first().text().trim();
      if (text.length > 100) return text.replace(/\s+/g, " ").slice(0, 4000);
    }

    return "";
  } catch (error) {
    console.error("JD scrape failed (continuing without it):", error.message);
    return "";
  }
}



async function callGemini(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message || `Gemini API error (${response.status})`);
  }

  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    const blockReason = data?.promptFeedback?.blockReason;
    throw new Error(
      blockReason
        ? `Gemini declined to respond (reason: ${blockReason}).`
        : "No text returned by Gemini."
    );
  }

  return text.trim();
}


router.post("/", requireAuth, async (req, res) => {
  if (!GEMINI_API_KEY) {
    return res.status(500).json({
      success: false,
      message:
        "AI resume tailoring isn't configured yet — add GEMINI_API_KEY to backend/.env " +
        "(get a free one at aistudio.google.com/apikey) and restart the backend.",
    });
  }

  try {
    const { jobUrl, jobTitle, company } = req.body;

    if (!jobTitle) {
      return res.status(400).json({ success: false, message: "jobTitle is required" });
    }

    const resume = await ParsedResume.findOne({ user: req.user._id }).sort({ createdAt: -1 });

    if (!resume || !resume.raw_text) {
      return res.status(404).json({
        success: false,
        message:
          "Upload a resume on your dashboard first — tailoring reuses that, so you only need to upload once.",
      });
    }

    const jobDescription = await scrapeJobDescription(jobUrl);

    const prompt = `You are rewriting a real person's resume to better match a specific job — NOT writing a new one. Follow these rules exactly:

1. Do NOT invent any job, employer, degree, date, project, or skill that is not already present in the ORIGINAL RESUME TEXT below. If the job wants something the original resume does not show evidence of, simply leave that gap — do not fabricate it.
2. Keep the exact same sections, structure, and factual content (same employers, same dates, same degrees, same project names).
3. You MAY: reword bullet points using the job posting's own terminology where it genuinely describes the same real work; reorder bullets/skills to put the most relevant ones first; tighten vague phrasing into more specific, quantified language IF the specifics are implied by the original text (do not invent numbers that aren't implied).
4. Output the full rewritten resume as plain text, same overall structure as the original.
5. After the resume, add a line "---NOTES---" followed by a short bullet list of any skills/requirements the job wants that this resume genuinely does not support, so the person knows what's still a real gap (not something you papered over).

ORIGINAL RESUME TEXT:
${resume.raw_text}

TARGET JOB:
- Title: ${jobTitle}
- Company: ${company || "not specified"}
${jobDescription ? `- Job description: ${jobDescription}` : "- (No job description available — tailor toward the job title alone.)"}`;

    const raw = await callGemini(prompt);
    const [resumePart, notesPart] = raw.split("---NOTES---");

    return res.status(200).json({
      success: true,
      tailoredResume: (resumePart || raw).trim(),
      gapNotes: (notesPart || "").trim(),
      usedJobDescription: jobDescription.length > 0,
    });
  } catch (error) {
    console.error("Resume tailoring error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Could not tailor this resume right now.",
    });
  }
});

module.exports = router;