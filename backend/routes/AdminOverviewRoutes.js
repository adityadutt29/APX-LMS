const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const { getAdminOverview } = require('../controllers/AdminOverviewController');

// Route for admin overview dashboard
router.get('/overview', protect, getAdminOverview);

module.exports = router;
