const express = require("express");
const bcrypt = require("bcryptjs");
const passport = require("../passport/passport");
const User = require("../models/User");

const router = express.Router();


router.post("/signup", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const normalizedEmail = email
      .toLowerCase()
      .trim();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(
      password,
      12
    );

    const generatedName =
      normalizedEmail.split("@")[0];

    const user = await User.create({
      name: generatedName,
      email: normalizedEmail,
      password: hashedPassword,
      provider: "local",
    });

    req.login(user, (err) => {
      if (err) {
        console.error(
          "Session creation error:",
          err
        );

        return res.status(500).json({
          success: false,
          message: "Could not create login session",
        });
      }

      return res.status(201).json({
        success: true,
        message: "Account created successfully",

        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          provider: user.provider,
        },
      });
    });

  } catch (error) {
    console.error(
      "Signup error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Something went wrong during signup",
    });
  }
});


router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email
      .toLowerCase()
      .trim();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (!user.password) {
      return res.status(401).json({
        success: false,
        message: `This account uses ${user.provider} login`,
      });
    }

    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    req.login(user, (err) => {
      if (err) {
        console.error(
          "Session creation error:",
          err
        );

        return res.status(500).json({
          success: false,
          message: "Could not create login session",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Login successful",

        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          provider: user.provider,
        },
      });
    });

  } catch (error) {
    console.error(
      "Login error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Something went wrong during login",
    });
  }
});



// Start Google OAuth
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);


router.get(
  "/google/callback",

  passport.authenticate("google", {
    failureRedirect:
      `${process.env.CLIENT_URL}/login?error=google_failed`,
  }),

  (req, res) => {
    res.redirect(
      `${process.env.CLIENT_URL}/dashboard`
    );
  }
);

router.get(
  "/github",
  passport.authenticate("github", {
    scope: ["user:email"],
  })
);

router.get(
  "/github/callback",

  passport.authenticate("github", {
    failureRedirect:
      `${process.env.CLIENT_URL}/login?error=github_failed`,
  }),

  (req, res) => {
    res.redirect(
      `${process.env.CLIENT_URL}/dashboard`
    );
  }
);


router.get("/me", (req, res) => {

  if (!req.isAuthenticated()) {
    return res.status(401).json({
      authenticated: false,
      user: null,
    });
  }

  return res.status(200).json({
    authenticated: true,

    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      avatar: req.user.avatar,
      provider: req.user.provider,
    },
  });
});



router.post("/logout", (req, res) => {

  req.logout((err) => {

    if (err) {
      console.error(
        "Logout error:",
        err
      );

      return res.status(500).json({
        success: false,
        message: "Logout failed",
      });
    }

    req.session.destroy((sessionError) => {

      if (sessionError) {
        console.error(
          "Session destroy error:",
          sessionError
        );

        return res.status(500).json({
          success: false,
          message: "Could not destroy session",
        });
      }

      res.clearCookie("connect.sid");

      return res.status(200).json({
        success: true,
        message: "Logged out successfully",
      });
    });
  });
});


module.exports = router;