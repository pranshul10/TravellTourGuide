const express = require('express');
const { getPlaceholderImage } = require('../controllers/placeholderController');
const router = express.Router();
// Handles GET requests with parameters relative to the mount path
// In server.js: app.use('/api/placeholder', placeholderRoutes);
// So this handles: GET /api/placeholder/:width/:height
router.get('/:width/:height', getPlaceholderImage);
module.exports = router;