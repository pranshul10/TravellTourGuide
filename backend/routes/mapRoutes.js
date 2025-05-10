const express = require('express');
const { geocode, calculateRoute } = require('../controllers/mapController');
const router = express.Router();

// Geocode a location name to lat/lon
// GET /api/map/geocode?location=Paris
router.get('/geocode', geocode);

// Get route details between two lat/lon points
// GET /api/map/route?from_lat=...&from_lon=...&to_lat=...&to_lon=...
router.get('/route', calculateRoute);

module.exports = router;