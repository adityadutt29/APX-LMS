const express = require('express');
const router = express.Router();
const {
  generateViva,
  getViva,
  getUserVivas,
  deleteViva,
  submitAnswer,
  getVivaFeedback
} = require('../controllers/VivaController');
const auth = require('../middleware/auth');
const protect = require('../middleware/auth');
const { validateVivaGeneration, validateAnswerSubmission } = require('../middleware/validateViva');

// All routes require authentication
router.use(auth);

// Generate new viva
router.post('/generate', validateVivaGeneration, generateViva);

// Get user's vivas
router.get('/user', getUserVivas);

// Get specific viva by mockId
router.get('/:mockId', getViva);

// Delete viva
router.delete('/:mockId', deleteViva);

// Submit answer for a question
router.post('/:mockId/submit', validateAnswerSubmission, submitAnswer);

// Get viva feedback
router.get('/:mockId/feedback', getVivaFeedback);

// GET /api/viva/all - get all vivas
router.get('/all', protect, async (req, res) => {
  try {
    const vivas = await Viva.find({});
    res.json(vivas);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch vivas' });
  }
});

module.exports = router;
