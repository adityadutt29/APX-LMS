const Flashcard = require('../models/Flashcard');

// @desc    Get all flashcards for a user
// @route   GET /api/flashcards
// @access  Private
const getFlashcards = async (req, res) => {
  try {
    const flashcards = await Flashcard.find({ userId: req.user.id })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: flashcards
    });
  } catch (error) {
    console.error('Get flashcards error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create new flashcard
// @route   POST /api/flashcards
// @access  Private
const createFlashcard = async (req, res) => {
  try {
    const { front, back } = req.body;

    if (!front || !back) {
      return res.status(400).json({ message: 'Question and answer are required' });
    }

    const flashcard = new Flashcard({
      front: front.trim(),
      back: back.trim(),
      userId: req.user.id
    });

    const savedFlashcard = await flashcard.save();

    res.status(201).json({
      success: true,
      data: savedFlashcard
    });
  } catch (error) {
    console.error('Create flashcard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update flashcard
// @route   PUT /api/flashcards/:id
// @access  Private
const updateFlashcard = async (req, res) => {
  try {
    const { front, back } = req.body;
    const flashcardId = req.params.id;

    if (!front || !back) {
      return res.status(400).json({ message: 'Question and answer are required' });
    }

    const flashcard = await Flashcard.findOne({ 
      _id: flashcardId, 
      userId: req.user.id 
    });

    if (!flashcard) {
      return res.status(404).json({ message: 'Flashcard not found' });
    }

    flashcard.front = front.trim();
    flashcard.back = back.trim();

    const updatedFlashcard = await flashcard.save();

    res.json({
      success: true,
      data: updatedFlashcard
    });
  } catch (error) {
    console.error('Update flashcard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete flashcard
// @route   DELETE /api/flashcards/:id
// @access  Private
const deleteFlashcard = async (req, res) => {
  try {
    const flashcardId = req.params.id;

    const flashcard = await Flashcard.findOne({ 
      _id: flashcardId, 
      userId: req.user.id 
    });

    if (!flashcard) {
      return res.status(404).json({ message: 'Flashcard not found' });
    }

    await Flashcard.findByIdAndDelete(flashcardId);

    res.json({
      success: true,
      message: 'Flashcard deleted successfully'
    });
  } catch (error) {
    console.error('Delete flashcard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single flashcard
// @route   GET /api/flashcards/:id
// @access  Private
const getFlashcard = async (req, res) => {
  try {
    const flashcardId = req.params.id;

    const flashcard = await Flashcard.findOne({ 
      _id: flashcardId, 
      userId: req.user.id 
    });

    if (!flashcard) {
      return res.status(404).json({ message: 'Flashcard not found' });
    }

    res.json({
      success: true,
      data: flashcard
    });
  } catch (error) {
    console.error('Get flashcard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getFlashcards,
  createFlashcard,
  updateFlashcard,
  deleteFlashcard,
  getFlashcard
};
