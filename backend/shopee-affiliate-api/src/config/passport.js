const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user);
  } catch (error) {
    done(error);
  }
});

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const user = await prisma.user.upsert({
        where: { googleId: profile.id },
        update: {
          lastLoginAt: new Date()
        },
        create: {
          email: profile.emails[0].value,
          name: profile.displayName,
          googleId: profile.id,
          picture: profile.photos[0]?.value,
        }
      });
      done(null, user);
    } catch (error) {
      done(error);
    }
  }
));

module.exports = passport;
