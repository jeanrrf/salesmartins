const express = require('express');
const passport = require('../config/passport');
const router = express.Router();

router.post('/login', passport.authenticate('local'), (req, res) => {
  res.json({ user: req.user });
});

router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => res.redirect(process.env.GOOGLE_SUCCESS_REDIRECT)
);

router.get('/logout', (req, res) => {
  req.logout();
  res.json({ success: true });
});

module.exports = router;
