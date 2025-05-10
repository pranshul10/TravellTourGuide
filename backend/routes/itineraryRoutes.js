const express = require('express');
const { generateItinerary } = require('../controllers/itineraryController');
const router = express.Router();

// Handles POST requests to '/generate' relative to the mount path
// In server.js: app.use('/api/itinerary', itineraryRoutes);
// So this handles: POST /api/itinerary/generate
router.post('/generate', generateItinerary);

module.exports = router;