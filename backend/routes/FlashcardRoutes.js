const express = require('express');
const {
  getFlashcards,
  createFlashcard,
  updateFlashcard,
  deleteFlashcard,
  getFlashcard
} = require('../controllers/FlashcardController');
const { bulkCreateFlashcards } = require('../controllers/FlashcardController');
const auth = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(auth);

// @route   GET /api/flashcards
// @desc    Get all flashcards for user
// @access  Private
router.get('/', getFlashcards);

// @route   POST /api/flashcards
// @desc    Create new flashcard
// @access  Private
router.post('/', createFlashcard);

// @route   POST /api/flashcards/bulk
// @desc    Bulk create flashcards (associate with pack)
// @access  Private
router.post('/bulk', bulkCreateFlashcards);

// @route   GET /api/flashcards/:id
// @desc    Get single flashcard
// @access  Private
router.get('/:id', getFlashcard);

// @route   PUT /api/flashcards/:id
// @desc    Update flashcard
// @access  Private
router.put('/:id', updateFlashcard);

// @route   DELETE /api/flashcards/:id
// @desc    Delete flashcard
// @access  Private
router.delete('/:id', deleteFlashcard);

module.exports = router;
