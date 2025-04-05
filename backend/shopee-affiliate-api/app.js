const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('./src/config/passport');
const securityHeaders = require('./middlewares/securityHeaders');
const authRoutes = require('./src/routes/auth');

const app = express();

// Apply security headers middleware
app.use(securityHeaders);

// Session and passport configuration
app.use(session({
  secret: process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

app.use(bodyParser.json());

// Routes
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.post('/data', (req, res) => {
  res.json(req.body);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});