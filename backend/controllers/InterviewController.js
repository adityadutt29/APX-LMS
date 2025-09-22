// This file is deprecated and should be deleted.
// All interview logic is now handled by VivaController.js.
const CerebrasService = require('../services/CerebrasService');
const { v4: uuidv4 } = require('uuid');

// Generate interview questions
exports.generateInterview = async (req, res) => {
  try {
    const { jobPosition, jobDesc, jobExp } = req.body;
    const userEmail = req.user.email;

    // Generate questions using Cerebras AI
    const questions = await CerebrasService.generateInterviewQuestions(
      jobPosition, 
      jobDesc, 
      jobExp, 
      process.env.INTERVIEW_QUESTION_COUNT || 5
    );

    // Create interview record and attempt to save. If saving fails (e.g., no DB in dev),
    // log the error but still return the generated questions to the client so frontend
    // testing can continue.
    const mockId = uuidv4();
    const interview = new Interview({
      mockId,
      jobPosition,
      jobDesc,
      jobExp,
      jsonMockResp: JSON.stringify(questions),
      createdBy: userEmail
    });

    let persisted = true;
    try {
      await interview.save();
    } catch (saveErr) {
      persisted = false;
      console.error('Interview save failed, returning generated questions without persisting:', saveErr.message || saveErr);
    }

    res.status(201).json({
      success: true,
      mockId,
      questions,
      persisted,
      message: persisted ? 'Interview generated and saved successfully' : 'Interview generated but not saved (DB error)'
    });

  } catch (error) {
    console.error('Error generating interview:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate interview'
    });
  }
};

// Get interview by mockId
exports.getInterview = async (req, res) => {
  try {
    const { mockId } = req.params;
    
    const interview = await Interview.findOne({ mockId });
    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    res.json({
      success: true,
      interview: {
        ...interview.toObject(),
        questions: JSON.parse(interview.jsonMockResp)
      }
    });

  } catch (error) {
    console.error('Error fetching interview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch interview'
    });
  }
};

// Get user's interviews
exports.getUserInterviews = async (req, res) => {
  try {
    const userEmail = req.user.email;
    
    const interviews = await Interview.find({ createdBy: userEmail })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      interviews
    });

  } catch (error) {
    console.error('Error fetching user interviews:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch interviews'
    });
  }
};

// Delete interview
exports.deleteInterview = async (req, res) => {
  try {
    const { mockId } = req.params;
    const userEmail = req.user.email;

    const interview = await Interview.findOne({ mockId, createdBy: userEmail });
    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    await Interview.deleteOne({ mockId });
    await UserAnswer.deleteMany({ mockIdRef: mockId });

    res.json({
      success: true,
      message: 'Interview deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting interview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete interview'
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

// Get interview feedback
exports.getInterviewFeedback = async (req, res) => {
  try {
    const { mockId } = req.params;
    
    const answers = await UserAnswer.find({ mockIdRef: mockId })
      .sort({ createdAt: 1 });

    if (answers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No answers found for this interview'
      });
    }

    // Calculate overall rating
    const totalRating = answers.reduce((sum, answer) => {
      return sum + (parseFloat(answer.rating) || 0);
    }, 0);
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

// Get user's interview results
exports.getUserInterviewResults = async (req, res) => {
  try {
    const userEmail = req.user.email;
    
    const answers = await UserAnswer.find({ userEmail })
      .sort({ createdAt: -1 });

    // Group answers by mockId to get unique interviews
    const interviewMap = new Map();
    answers.forEach(answer => {
      if (!interviewMap.has(answer.mockIdRef)) {
        interviewMap.set(answer.mockIdRef, {
          mockIdRef: answer.mockIdRef,
          createdAt: answer.createdAt,
          ratings: [parseFloat(answer.rating) || 0],
          feedback: answer.feedback,
          totalQuestions: 1
        });
      } else {
        const existing = interviewMap.get(answer.mockIdRef);
        existing.ratings.push(parseFloat(answer.rating) || 0);
        existing.totalQuestions += 1;
        // Keep the most recent createdAt
        if (answer.createdAt > existing.createdAt) {
          existing.createdAt = answer.createdAt;
        }
      }
    });

    // Calculate average rating for each interview
    const interviewResults = Array.from(interviewMap.values()).map(interview => {
      const averageRating = interview.ratings.reduce((sum, rating) => sum + rating, 0) / interview.ratings.length;
      return {
        mockIdRef: interview.mockIdRef,
        rating: averageRating.toFixed(1),
        createdAt: interview.createdAt,
        feedback: interview.feedback,
        totalQuestions: interview.totalQuestions
      };
    });

    res.json({
      success: true,
      data: interviewResults
    });

  } catch (error) {
    console.error('Error fetching user interview results:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch interview results'
    });
  }
};
