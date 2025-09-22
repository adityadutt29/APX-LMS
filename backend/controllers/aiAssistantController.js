// backend/controllers/aiAssistantController.js
const cerebrasService = require('../services/CerebrasService');

// POST /ai-assistant: AI assistant for education questions
exports.handleAiAssistant = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }
    // Call CerebrasService AI assistant method
    const response = await cerebrasService.aiAssistant(message);
    res.json({ response });
  } catch (error) {
    console.error('AI assistant error:', error);
    res.status(500).json({ error: 'AI assistant error' });
  }
};
