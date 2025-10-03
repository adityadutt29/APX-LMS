const express = require('express');
const router = express.Router();
const {
  getFlashcards,
  createFlashcard,
  updateFlashcard,
  deleteFlashcard
} = require('../controllers/FlashcardController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

router.route('/')
  .get(getFlashcards)
  .post(createFlashcard);

router.route('/:id')
  .patch(updateFlashcard)
  .delete(deleteFlashcard);

module.exports = router;
