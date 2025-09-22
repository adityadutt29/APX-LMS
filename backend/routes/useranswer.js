const express = require('express');
const router = express.Router();
const UserAnswer = require('../models/UserAnswer'); // Adjust path as needed

// GET /api/useranswer/all - get all user answers
router.get('/all', async (req, res) => {
  try {
    const answers = await UserAnswer.find({});
    res.json(answers);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user answers' });
  }
});

module.exports = router;
