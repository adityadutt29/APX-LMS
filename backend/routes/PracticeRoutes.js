const express = require('express');
const {
  generateQuiz,
  generateFlashcards,
  generateMindmap,
  generateSummary,
  generateNotes,
  evaluateAnswer,
  storePracticeResult,
  getPracticeHistory,
  getPracticeResult,
  getUserPracticeResults,
  initPracticeSession,
  finalizePracticeSession
  ,updatePracticeSessionProgress
  ,archiveStalePracticeSessions
  ,deletePracticeResult
  ,deletePracticePack
  ,restorePracticeResult
  ,restorePracticePack
  ,renamePracticePack
} = require('../controllers/PracticeController');
const auth = require('../middleware/auth');

const router = express.Router();

// Practice routes
router.post('/generate-quiz', auth, generateQuiz);
router.post('/generate-flashcards', auth, generateFlashcards);
router.post('/generate-mindmap', auth, generateMindmap);
router.post('/generate-summary', auth, generateSummary);
router.post('/generate-notes', auth, generateNotes);
router.post('/evaluate-answer', auth, evaluateAnswer);
router.post('/results', auth, storePracticeResult);
router.post('/sessions/init', auth, initPracticeSession);
router.patch('/sessions/:sessionId/finalize', auth, finalizePracticeSession);
router.patch('/sessions/:sessionId/progress', auth, updatePracticeSessionProgress);
router.post('/sessions/archive-stale', auth, archiveStalePracticeSessions);
router.get('/history', auth, getPracticeHistory);
router.get('/user-results', auth, getUserPracticeResults);
router.get('/results/:id', auth, getPracticeResult);
router.delete('/results/:id', auth, deletePracticeResult);
router.delete('/packs/:fileName', auth, deletePracticePack);
router.patch('/results/:id/restore', auth, restorePracticeResult);
router.patch('/packs/:fileName/restore', auth, restorePracticePack);
// Rename a study pack (updates PracticeResult.fileName and Flashcard.packName for current user)
router.patch('/packs/:fileName/rename', auth, renamePracticePack);

module.exports = router;
