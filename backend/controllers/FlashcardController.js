const Flashcard = require('../models/Flashcard');

// @desc    Get all flashcards for a user
// @route   GET /api/flashcards
// @access  Private
const getFlashcards = async (req, res) => {
  try {
    const userId = req.user.id;
    const flashcards = await Flashcard.find({ user: userId }).sort({ createdAt: -1 });
    res.json({
      success: true,
      data: flashcards,
      count: flashcards.length
    });
  } catch (error) {
    console.error('Get flashcards error:', error);
    res.status(500).json({ message: 'Failed to get flashcards' });
  }
};

// @desc    Create a new flashcard
// @route   POST /api/flashcards
// @access  Private
const createFlashcard = async (req, res) => {
  try {
    const userId = req.user.id;
    const { front, back } = req.body;

    if (!front || !back) {
      return res.status(400).json({ message: 'Front and back are required' });
    }

    const flashcard = new Flashcard({
      user: userId,
      front: front.trim(),
      back: back.trim()
    });

    await flashcard.save();

    res.status(201).json({
      success: true,
      data: flashcard,
      message: 'Flashcard created successfully'
    });
  } catch (error) {
    console.error('Create flashcard error:', error);
    res.status(500).json({ message: 'Failed to create flashcard' });
  }
};

// @desc    Bulk create flashcards (associate with pack/session)
// @route   POST /api/flashcards/bulk
// @access  Private
const bulkCreateFlashcards = async (req, res) => {
  try {
    const userId = req.user.id;
    const { cards, packName, sessionId } = req.body;
    if (!Array.isArray(cards) || cards.length === 0) {
      return res.status(400).json({ message: 'Cards array is required' });
    }
    const docs = cards.map(c => ({
      user: userId,
      front: (c.front || c.question || '').toString().trim(),
      back: (c.back || c.answer || '').toString().trim(),
      packName: packName || null,
      sessionId: sessionId || null
    })).filter(d => d.front && d.back);

    const created = await Flashcard.insertMany(docs);
    res.status(201).json({ success: true, count: created.length, data: created });
  } catch (error) {
    console.error('Bulk create flashcards error:', error);
    res.status(500).json({ message: 'Failed to bulk create flashcards' });
  }
}

// @desc    Update a flashcard
// @route   PATCH /api/flashcards/:id
// @access  Private
const updateFlashcard = async (req, res) => {
  try {
    const userId = req.user.id;
    const flashcardId = req.params.id;
    const { front, back } = req.body;

    const flashcard = await Flashcard.findOneAndUpdate(
      { _id: flashcardId, user: userId },
      { front: front?.trim(), back: back?.trim() },
      { new: true, runValidators: true }
    );

    if (!flashcard) {
      return res.status(404).json({ message: 'Flashcard not found' });
    }

    res.json({
      success: true,
      data: flashcard,
      message: 'Flashcard updated successfully'
    });
  } catch (error) {
    console.error('Update flashcard error:', error);
    res.status(500).json({ message: 'Failed to update flashcard' });
  }
};

// @desc    Delete a flashcard
// @route   DELETE /api/flashcards/:id
// @access  Private
const deleteFlashcard = async (req, res) => {
  try {
    const userId = req.user.id;
    const flashcardId = req.params.id;

    const flashcard = await Flashcard.findOneAndDelete({
      _id: flashcardId,
      user: userId
    });

    if (!flashcard) {
      return res.status(404).json({ message: 'Flashcard not found' });
    }

    res.json({
      success: true,
      message: 'Flashcard deleted successfully'
    });
  } catch (error) {
    console.error('Delete flashcard error:', error);
    res.status(500).json({ message: 'Failed to delete flashcard' });
  }
};

module.exports = {
  getFlashcards,
  createFlashcard,
  updateFlashcard,
  deleteFlashcard
};
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

// export new bulk function
module.exports.bulkCreateFlashcards = bulkCreateFlashcards;
