const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const GitHubStrategy = require("passport-github2").Strategy;

const User = require("../models/User");


passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.SERVER_URL}/auth/google/callback`,
    },

    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;

        if (!email) {
          return done(new Error("Google account email not available"));
        }

        let user = await User.findOne({
          $or: [
            { googleId: profile.id },
            { email: email.toLowerCase() },
          ],
        });

        if (!user) {
          user = await User.create({
            name: profile.displayName,
            email: email.toLowerCase(),
            googleId: profile.id,
            provider: "google",
            avatar: profile.photos?.[0]?.value || null,
          });
        } else {
          if (!user.googleId) {
            user.googleId = profile.id;
          }

          user.name = profile.displayName || user.name;
          user.avatar = profile.photos?.[0]?.value || user.avatar;

          await user.save();
        }

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);


passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: `${process.env.SERVER_URL}/auth/github/callback`,
    },

    async (accessToken, refreshToken, profile, done) => {
      try {
        let email = profile.emails?.[0]?.value;

        if (!email) {
          email = `${profile.username}@github.local`;
        }

        email = email.toLowerCase();

        let user = await User.findOne({
          $or: [
            { githubId: profile.id },
            { email: email },
          ],
        });

        if (!user) {
          user = await User.create({
            name: profile.displayName || profile.username,
            email: email,
            githubId: profile.id,
            provider: "github",
            avatar: profile.photos?.[0]?.value || null,
          });
        } else {
          if (!user.githubId) {
            user.githubId = profile.id;
          }

          user.name =
            profile.displayName || profile.username || user.name;

          user.avatar =
            profile.photos?.[0]?.value || user.avatar;

          await user.save();
        }

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);

    if (!user) {
      return done(null, false);
    }

    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;