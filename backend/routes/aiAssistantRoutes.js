const express = require('express');
const router = express.Router();
const { handleAiAssistant } = require('../controllers/aiAssistantController');

// POST / (root): AI assistant for education questions
router.post('/', handleAiAssistant);

module.exports = router;
