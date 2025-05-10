const express = require('express');
const { getWeather } = require('../controllers/weatherController');
const router = express.Router();

// Handles GET requests to the path where this router is mounted
// In server.js: app.use('/api/weather', weatherRoutes);
// So this handles: GET /api/weather
router.get('/', getWeather);

module.exports = router;