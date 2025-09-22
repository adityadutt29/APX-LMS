const Viva = require('../models/Viva');
const UserAnswer = require('../models/UserAnswer');
const CerebrasService = require('../services/CerebrasService');
const { v4: uuidv4 } = require('uuid');

// Generate viva questions
exports.generateViva = async (req, res) => {
  try {
    const { subject, topics, difficulty } = req.body;
    const userEmail = req.user.email;

    // Generate questions using Cerebras AI
    const questions = await CerebrasService.generateVivaQuestions(
      subject, 
      topics, 
      difficulty,
      process.env.VIVA_QUESTION_COUNT || 5
    );

    const mockId = uuidv4();
    const viva = new Viva({
      mockId,
      subject,
      topics,
      difficulty,
      jsonMockResp: JSON.stringify(questions),
      createdBy: userEmail
    });

    let persisted = true;
    try {
      await viva.save();
    } catch (saveErr) {
      persisted = false;
      console.error('Viva save failed, returning generated questions without persisting:', saveErr.message || saveErr);
    }

    res.status(201).json({
      success: true,
      mockId,
      questions,
      persisted,
      message: persisted ? 'Viva generated and saved successfully' : 'Viva generated but not saved (DB error)'
    });

  } catch (error) {
    console.error('Error generating viva:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate viva'
    });
  }
};

// Get viva by mockId
exports.getViva = async (req, res) => {
  try {
    const { mockId } = req.params;
    const viva = await Viva.findOne({ mockId });
    if (!viva) {
      return res.status(404).json({
        success: false,
        message: 'Viva not found'
      });
    }

    res.json({
      success: true,
      viva: {
        ...viva.toObject(),
        questions: JSON.parse(viva.jsonMockResp)
      }
    });

  } catch (error) {
    console.error('Error fetching viva:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch viva'
    });
  }
};

// Get user's vivas
exports.getUserVivas = async (req, res) => {
  try {
    const userEmail = req.user.email;
    const vivas = await Viva.find({ createdBy: userEmail }).sort({ createdAt: -1 });
    res.json({
      success: true,
      vivas
    });
  } catch (error) {
    console.error('Error fetching user vivas:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vivas'
    });
  }
};

// Delete viva
exports.deleteViva = async (req, res) => {
  try {
    const { mockId } = req.params;
    const userEmail = req.user.email;

    const viva = await Viva.findOne({ mockId, createdBy: userEmail });
    if (!viva) {
      return res.status(404).json({
        success: false,
        message: 'Viva not found'
      });
    }

    await Viva.deleteOne({ mockId });
    await UserAnswer.deleteMany({ mockIdRef: mockId });

    res.json({
      success: true,
      message: 'Viva deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting viva:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete viva'
    });
  }
};

// Submit answer and get feedback
exports.submitAnswer = async (req, res) => {
  try {
    const { mockId } = req.params;
    const { question, correctAns, userAns } = req.body;
    const userEmail = req.user.email;

    // Generate feedback using Cerebras AI
    const feedback = await CerebrasService.generateFeedback(question, userAns, correctAns);

    // Save user answer
    const userAnswer = new UserAnswer({
      mockIdRef: mockId,
      question,
      correctAns,
      userAns,
      feedback: feedback.feedback,
      rating: feedback.rating.toString(),
      userEmail
    });

    await userAnswer.save();

    res.json({
      success: true,
      feedback,
      message: 'Answer submitted successfully'
    });

  } catch (error) {
    console.error('Error submitting answer:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to submit answer'
    });
  }
};

// Get viva feedback
exports.getVivaFeedback = async (req, res) => {
  try {
    const { mockId } = req.params;
    const answers = await UserAnswer.find({ mockIdRef: mockId }).sort({ createdAt: 1 });

    if (answers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No answers found for this viva'
      });
    }

    // Calculate overall rating
    const totalRating = answers.reduce((sum, answer) => sum + (parseFloat(answer.rating) || 0), 0);
    const averageRating = totalRating / answers.length;

    res.json({
      success: true,
      answers,
      overallRating: averageRating.toFixed(1)
    });

  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feedback'
    });
  }
};