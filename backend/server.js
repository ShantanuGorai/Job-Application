require("dotenv").config();

const express = require("express");
const cors = require("cors");
const session = require("express-session");
const passport = require("./passport/passport");

const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const websiteRequestRoutes = require("./routes/websiteRequest");
const careerProfileRoutes = require("./routes/careerProfile");
const parseResumeRoutes = require("./routes/parseResume");
const appliedJobsRoutes = require("./routes/appliedJobs");
const generatePitchRoutes = require("./routes/generatePitch");
const tailorResumeRoutes = require("./routes/tailorResume");

const app = express();

connectDB();

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use("/auth", authRoutes);
app.use("/api/website-requests", websiteRequestRoutes);
app.use("/api/career-profiles", careerProfileRoutes);
app.use("/api/parse-resume", parseResumeRoutes);
app.use("/api/applied-jobs", appliedJobsRoutes);
app.use("/api/generate-pitch", generatePitchRoutes);
app.use("/api/tailor-resume", tailorResumeRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "server backend running ...",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`server running on port ${PORT}`);
});