const Viva = require('../models/Viva');
const UserAnswer = require('../models/UserAnswer');
const CerebrasService = require('../services/CerebrasService');

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

    // Dynamically import uuid and generate mockId
    const { v4: uuidv4 } = await import('uuid');
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

// Get user's viva practice results for profile
exports.getUserVivaResults = async (req, res) => {
  try {
    const userEmail = req.user.email;
    
    const answers = await UserAnswer.find({ userEmail })
      .sort({ createdAt: -1 });

    // Group answers by mockId to get unique viva sessions
    const vivaMap = new Map();
    answers.forEach(answer => {
      if (!vivaMap.has(answer.mockIdRef)) {
        vivaMap.set(answer.mockIdRef, {
          mockIdRef: answer.mockIdRef,
          createdAt: answer.createdAt,
          ratings: [parseFloat(answer.rating) || 0],
          feedback: answer.feedback,
          totalQuestions: 1,
          correctAnswers: (parseFloat(answer.rating) || 0) >= 3 ? 1 : 0
        });
      } else {
        const existing = vivaMap.get(answer.mockIdRef);
        existing.ratings.push(parseFloat(answer.rating) || 0);
        existing.totalQuestions += 1;
        existing.correctAnswers += (parseFloat(answer.rating) || 0) >= 3 ? 1 : 0;
        if (answer.createdAt > existing.createdAt) {
          existing.createdAt = answer.createdAt;
        }
      }
    });

    // Calculate score for each viva session
    const vivaResults = Array.from(vivaMap.values()).map(viva => {
      const averageRating = viva.ratings.reduce((sum, rating) => sum + rating, 0) / viva.ratings.length;
      const score = Math.round((averageRating / 5) * 100); // Convert rating to percentage
      
      return {
        mockIdRef: viva.mockIdRef,
        score: score,
        totalQuestions: viva.totalQuestions,
        correctAnswers: viva.correctAnswers,
        topic: 'Viva Practice', // Default topic
        createdAt: viva.createdAt,
        feedback: viva.feedback
      };
    });

    res.json({
      success: true,
      data: vivaResults
    });

  } catch (error) {
    console.error('Error fetching user viva results:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch viva results',
      data: []
    });
  }
};