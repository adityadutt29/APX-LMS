const express = require('express');
const router = express.Router();
const authController = require('../controllers/AuthController');
const auth = require('../middleware/auth');

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
router.post('/login', authController.login);

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', authController.register);

// Google OAuth routes
router.post('/google', authController.googleLogin);
router.get('/google/callback', authController.googleCallback);

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
router.get('/profile', auth, authController.getProfile);

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
router.put('/profile', auth, authController.updateProfile);

module.exports = router;