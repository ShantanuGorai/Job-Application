const express = require("express");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const passport = require("../passport/passport");
const User = require("../models/User");

const router = express.Router();


// =====================================================
// EMAIL TRANSPORTER
// =====================================================

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});


// =====================================================
// GENERATE OTP
// =====================================================

function generateOTP() {
  return crypto.randomInt(1000, 10000).toString();
}


// =====================================================
// SEND OTP EMAIL
// =====================================================

async function sendVerificationEmail(email, otp) {
  await transporter.sendMail({
    from: `"EaseMize" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Verify your EaseMize account",
    text: `Your EaseMize verification code is ${otp}. This code expires in 10 minutes.`,

    html: `
      <div style="
        font-family: Arial, sans-serif;
        max-width: 600px;
        margin: auto;
        padding: 30px;
        background: #111111;
        color: white;
        border-radius: 12px;
      ">

        <h1 style="margin-bottom: 10px;">
          Welcome to EaseMize
        </h1>

        <p style="color: #cccccc;">
          Use the verification code below to verify your email address.
        </p>

        <div style="
          margin: 30px 0;
          padding: 20px;
          background: #222222;
          border-radius: 10px;
          text-align: center;
        ">

          <span style="
            font-size: 36px;
            font-weight: bold;
            letter-spacing: 10px;
          ">
            ${otp}
          </span>

        </div>

        <p style="color: #aaaaaa;">
          This verification code will expire in
          <strong>10 minutes</strong>.
        </p>

        <p style="color: #777777; font-size: 13px;">
          If you did not create an EaseMize account, you can safely ignore this email.
        </p>

      </div>
    `,
  });
}


// =====================================================
// EMAIL SIGNUP
// =====================================================

router.post("/signup", async (req, res) => {
  try {
    const { email, password } = req.body;

    // -------------------------------------------------
    // VALIDATION
    // -------------------------------------------------

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

    const normalizedEmail = email.toLowerCase().trim();


    // -------------------------------------------------
    // CHECK EXISTING USER
    // -------------------------------------------------

    let user = await User.findOne({
      email: normalizedEmail,
    });


    // -------------------------------------------------
    // IF USER ALREADY EXISTS
    // -------------------------------------------------

    if (user) {

      // Already verified
      if (user.emailVerified) {
        return res.status(409).json({
          success: false,
          message: "An account with this email already exists",
        });
      }

      // OAuth account
      if (user.provider !== "local") {
        return res.status(409).json({
          success: false,
          message: `This email is already registered using ${user.provider} login`,
        });
      }

      // Existing unverified local account
      // We will update password and send a fresh OTP

      const hashedPassword = await bcrypt.hash(password, 12);

      const otp = generateOTP();

      const otpExpires = new Date(
        Date.now() + 10 * 60 * 1000
      );

      user.password = hashedPassword;
      user.verificationOTP = otp;
      user.verificationOTPExpires = otpExpires;

      await user.save();

      try {
        await sendVerificationEmail(
          normalizedEmail,
          otp
        );
      } catch (emailError) {

        console.error(
          "OTP email error:",
          emailError
        );

        return res.status(500).json({
          success: false,
          message: "Could not send verification email",
        });
      }

      return res.status(200).json({
        success: true,
        requiresVerification: true,
        message: "A new verification code has been sent to your email",
        email: normalizedEmail,
      });
    }


    // -------------------------------------------------
    // CREATE NEW USER
    // -------------------------------------------------

    const hashedPassword = await bcrypt.hash(
      password,
      12
    );

    const generatedName =
      normalizedEmail.split("@")[0];

    const otp = generateOTP();

    const otpExpires = new Date(
      Date.now() + 10 * 60 * 1000
    );


    user = await User.create({
      name: generatedName,
      email: normalizedEmail,
      password: hashedPassword,
      provider: "local",

      emailVerified: false,

      verificationOTP: otp,

      verificationOTPExpires: otpExpires,
    });


    // -------------------------------------------------
    // SEND OTP
    // -------------------------------------------------

    try {

      await sendVerificationEmail(
        normalizedEmail,
        otp
      );

    } catch (emailError) {

      console.error(
        "OTP email error:",
        emailError
      );

      // Remove user if email could not be sent
      await User.findByIdAndDelete(user._id);

      return res.status(500).json({
        success: false,
        message: "Could not send verification email",
      });
    }


    // -------------------------------------------------
    // RESPONSE
    // -------------------------------------------------

    return res.status(201).json({
      success: true,

      requiresVerification: true,

      message:
        "Verification code sent to your email",

      email: normalizedEmail,
    });

  } catch (error) {

    console.error(
      "Signup error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong during signup",
    });
  }
});


// =====================================================
// VERIFY OTP
// =====================================================

router.post("/verify-otp", async (req, res) => {
  try {

    const {
      email,
      otp,
    } = req.body;


    // -------------------------------------------------
    // VALIDATION
    // -------------------------------------------------

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message:
          "Email and verification code are required",
      });
    }


    const normalizedEmail =
      email.toLowerCase().trim();


    // -------------------------------------------------
    // FIND USER
    // -------------------------------------------------

    const user = await User.findOne({
      email: normalizedEmail,
      provider: "local",
    });


    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "Signup request not found",
      });
    }


    // -------------------------------------------------
    // ALREADY VERIFIED
    // -------------------------------------------------

    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        message:
          "Email is already verified",
      });
    }


    // -------------------------------------------------
    // CHECK OTP EXPIRY
    // -------------------------------------------------

    if (
      !user.verificationOTPExpires ||
      user.verificationOTPExpires.getTime() <
        Date.now()
    ) {

      return res.status(400).json({
        success: false,
        message:
          "Verification code has expired. Please request a new one.",
      });
    }


    // -------------------------------------------------
    // CHECK OTP
    // -------------------------------------------------

    if (
      String(otp).trim() !==
      String(user.verificationOTP).trim()
    ) {

      return res.status(400).json({
        success: false,
        message:
          "Invalid verification code",
      });
    }


    // -------------------------------------------------
    // VERIFY EMAIL
    // -------------------------------------------------

    user.emailVerified = true;

    user.verificationOTP = null;

    user.verificationOTPExpires = null;

    await user.save();


    // -------------------------------------------------
    // CREATE LOGIN SESSION
    // -------------------------------------------------

    req.login(user, (err) => {

      if (err) {

        console.error(
          "Session creation error:",
          err
        );

        return res.status(500).json({
          success: false,
          message:
            "Email verified but could not create login session",
        });
      }


      return res.status(200).json({

        success: true,

        message:
          "Email verified successfully",

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
      "OTP verification error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong during verification",
    });
  }
});


// =====================================================
// RESEND OTP
// =====================================================

router.post("/resend-otp", async (req, res) => {

  try {

    const { email } = req.body;


    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }


    const normalizedEmail =
      email.toLowerCase().trim();


    const user = await User.findOne({
      email: normalizedEmail,
      provider: "local",
    });


    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "Signup request not found",
      });
    }


    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        message:
          "Email is already verified",
      });
    }


    // Generate new OTP

    const otp = generateOTP();

    const otpExpires = new Date(
      Date.now() + 10 * 60 * 1000
    );


    user.verificationOTP = otp;

    user.verificationOTPExpires =
      otpExpires;


    await user.save();


    // Send email

    await sendVerificationEmail(
      normalizedEmail,
      otp
    );


    return res.status(200).json({
      success: true,
      message:
        "A new verification code has been sent",
    });

  } catch (error) {

    console.error(
      "Resend OTP error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Could not resend verification code",
    });
  }
});


// =====================================================
// EMAIL LOGIN
// =====================================================

router.post("/login", async (req, res) => {

  try {

    const {
      email,
      password,
    } = req.body;


    // -------------------------------------------------
    // VALIDATION
    // -------------------------------------------------

    if (!email || !password) {

      return res.status(400).json({
        success: false,
        message:
          "Email and password are required",
      });
    }


    const normalizedEmail =
      email.toLowerCase().trim();


    // -------------------------------------------------
    // FIND USER
    // -------------------------------------------------

    const user = await User.findOne({
      email: normalizedEmail,
    });


    if (!user) {

      return res.status(401).json({
        success: false,
        message:
          "Invalid email or password",
      });
    }


    // -------------------------------------------------
    // OAUTH ACCOUNT
    // -------------------------------------------------

    if (!user.password) {

      return res.status(401).json({
        success: false,
        message:
          `This account uses ${user.provider} login`,
      });
    }


    // -------------------------------------------------
    // EMAIL VERIFICATION
    // -------------------------------------------------

    if (!user.emailVerified) {

      return res.status(403).json({

        success: false,

        requiresVerification: true,

        message:
          "Please verify your email before logging in",

      });
    }


    // -------------------------------------------------
    // PASSWORD CHECK
    // -------------------------------------------------

    const passwordMatch =
      await bcrypt.compare(
        password,
        user.password
      );


    if (!passwordMatch) {

      return res.status(401).json({
        success: false,
        message:
          "Invalid email or password",
      });
    }


    // -------------------------------------------------
    // CREATE SESSION
    // -------------------------------------------------

    req.login(user, (err) => {

      if (err) {

        console.error(
          "Session creation error:",
          err
        );

        return res.status(500).json({
          success: false,
          message:
            "Could not create login session",
        });
      }


      return res.status(200).json({

        success: true,

        message:
          "Login successful",

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
      message:
        "Something went wrong during login",
    });
  }
});


// =====================================================
// GOOGLE LOGIN
// =====================================================

router.get(
  "/google",

  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);


// =====================================================
// GOOGLE CALLBACK
// =====================================================

router.get(
  "/google/callback",

  passport.authenticate("google", {

    // On failure, send the user back to the login app itself
    // (bolt_login has no /login route — it's a single view with
    // internal state — so we redirect to its root with a query
    // param it can read to show an error).
    failureRedirect:
      `${process.env.CLIENT_URL}/login?error=google_failed`,

  }),

  (req, res) => {

    // On success, send the user to the /hero route of the single app.
    res.redirect(
      `${process.env.CLIENT_URL}/hero`
    );

  }
);


// =====================================================
// GITHUB LOGIN
// =====================================================

router.get(
  "/github",

  passport.authenticate("github", {
    scope: ["user:email"],
  })
);


// =====================================================
// GITHUB CALLBACK
// =====================================================

router.get(
  "/github/callback",

  passport.authenticate("github", {

    failureRedirect:
      `${process.env.CLIENT_URL}/login?error=github_failed`,

  }),

  (req, res) => {

    res.redirect(
      `${process.env.CLIENT_URL}/hero`
    );

  }
);


// =====================================================
// GET CURRENT USER
// =====================================================

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

      emailVerified:
        req.user.emailVerified,

    },

  });
});


// =====================================================
// LOGOUT
// =====================================================

router.post("/logout", (req, res) => {

  req.logout((err) => {

    if (err) {

      console.error(
        "Logout error:",
        err
      );

      return res.status(500).json({

        success: false,

        message:
          "Logout failed",

      });
    }


    req.session.destroy(
      (sessionError) => {

        if (sessionError) {

          console.error(
            "Session destroy error:",
            sessionError
          );

          return res.status(500).json({

            success: false,

            message:
              "Could not destroy session",

          });
        }


        res.clearCookie(
          "connect.sid"
        );


        return res.status(200).json({

          success: true,

          message:
            "Logged out successfully",

        });

      }
    );

  });
});


module.exports = router;