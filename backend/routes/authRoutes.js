const express = require('express');
const { signup, login } = require('../controllers/authController');
const router = express.Router();

// In server.js: app.use('/api/auth', authRoutes);
// Handles: POST /api/auth/signup
router.post('/signup', signup);

// Handles: POST /api/auth/login
router.post('/login', login);

module.exports = router;