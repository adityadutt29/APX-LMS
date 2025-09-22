const express = require('express');
const router = express.Router();
const { login, getProfile, updateProfile, googleLogin, googleCallback } = require('../controllers/AuthController');
const { register } = require('../controllers/RegisterController');
const validateLogin = require('../middleware/validateLogin');
const validateRegister = require('../middleware/validateRegister');
const auth = require('../middleware/auth');

router.post('/login', validateLogin, login);
router.post('/register', validateRegister, register);
router.get('/me', auth, getProfile);
router.get('/profile', auth, getProfile); // Alias for compatibility
router.put('/profile', auth, updateProfile); // Alternative endpoint
router.put('/update-profile', auth, updateProfile);
router.post('/google', googleLogin);
router.get('/google/callback', googleCallback);

module.exports = router;
