const express = require('express');
const {
  generateQuiz,
  evaluateAnswer,
  storePracticeResult,
  getPracticeHistory,
  getPracticeResult,
  getUserPracticeResults
} = require('../controllers/PracticeController');
const auth = require('../middleware/auth');

const router = express.Router();

// Practice routes
router.post('/generate-quiz', auth, generateQuiz);
router.post('/evaluate-answer', auth, evaluateAnswer);
router.post('/results', auth, storePracticeResult);
router.get('/history', auth, getPracticeHistory);
router.get('/user-results', auth, getUserPracticeResults);
router.get('/results/:id', auth, getPracticeResult);

module.exports = router;
