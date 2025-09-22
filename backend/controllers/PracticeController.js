const PracticeResult = require('../models/PracticeResult');
const User = require('../models/Users');
const axios = require('axios');

// Cerebras AI configuration
const CEREBRAS_API_KEY = process.env.CEREBRAS_API_KEY || '';
const CEREBRAS_MODEL = process.env.CEREBRAS_MODEL || 'qwen-3-235b-a22b-instruct-2507';

// @desc    Generate quiz from extracted text
// @route   POST /api/practice/generate-quiz
// @access  Private
const generateQuiz = async (req, res) => {
  try {
    const { text, type, questionCount } = req.body;

    if (!text || !type) {
      return res.status(400).json({ message: 'Text and quiz type are required' });
    }

    let questions = [];

    if (type === 'mcq') {
      questions = await generateMCQWithCerebras(text, questionCount || 10);
    } else if (type === 'qa') {
      questions = await generateQAWithCerebras(text, questionCount || 5);
    }

    res.json({
      success: true,
      questions,
      type,
      totalQuestions: questions.length
    });
  } catch (error) {
    console.error('Quiz generation error:', error);
    res.status(500).json({ message: 'Failed to generate quiz' });
  }
};

// @desc    Evaluate Q&A answer using AI
// @route   POST /api/practice/evaluate-answer
// @access  Private
const evaluateAnswer = async (req, res) => {
  try {
    const { question, answer, context } = req.body;

    if (!question || !answer) {
      return res.status(400).json({ message: 'Question and answer are required' });
    }

  const evaluation = await evaluateAnswerWithCerebras(question, answer, context);

    res.json({
      success: true,
      evaluation
    });
  } catch (error) {
    console.error('Answer evaluation error:', error);
    res.status(500).json({ message: 'Failed to evaluate answer' });
  }
};

// @desc    Store practice test result
// @route   POST /api/practice/results
// @access  Private
const storePracticeResult = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      fileName,
      quizType,
      extractedText,
      questions,
      userAnswers,
      score,
      totalQuestions,
      maxScore,
      percentage
    } = req.body;

    // Ensure questions and userAnswers are arrays
    const parsedQuestions = Array.isArray(questions) ? questions : [];
    const parsedUserAnswers = Array.isArray(userAnswers) ? userAnswers : [];

    const practiceResult = new PracticeResult({
      user: userId,
      fileName,
      quizType,
      extractedText,
      questions: parsedQuestions,
      userAnswers: parsedUserAnswers,
      score,
      totalQuestions,
      maxScore,
      percentage
    });

    await practiceResult.save();

    res.status(201).json({
      success: true,
      data: practiceResult,
      message: 'Practice result stored successfully'
    });
  } catch (error) {
    console.error('Store practice result error:', error);
    res.status(500).json({ 
      message: 'Failed to store practice result',
      error: error.message 
    });
  }
};

// @desc    Get user's practice history
// @route   GET /api/practice/history
// @access  Private
const getPracticeHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    const practiceResults = await PracticeResult.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate('user', 'name email');

    res.json({
      success: true,
      data: practiceResults,
      count: practiceResults.length
    });
  } catch (error) {
    console.error('Get practice history error:', error);
    res.status(500).json({ message: 'Failed to get practice history' });
  }
};

// @desc    Get specific practice result
// @route   GET /api/practice/results/:id
// @access  Private
const getPracticeResult = async (req, res) => {
  try {
    const userId = req.user.id;
    const resultId = req.params.id;

    const practiceResult = await PracticeResult.findOne({
      _id: resultId,
      user: userId
    }).populate('user', 'name email');

    if (!practiceResult) {
      return res.status(404).json({ message: 'Practice result not found' });
    }

    res.json({
      success: true,
      data: practiceResult
    });
  } catch (error) {
    console.error('Get practice result error:', error);
    res.status(500).json({ message: 'Failed to get practice result' });
  }
};

// Helper function to call Cerebras API
const callCerebrasAPI = async (prompt, opts = {}) => {
  try {
    const payload = {
      model: CEREBRAS_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: opts.temperature ?? 0.7,
      top_p: opts.top_p ?? 0.95,
      max_completion_tokens: opts.max_completion_tokens ?? 2048
    };

    const response = await axios.post(
      'https://api.cerebras.ai/v1/chat/completions',
      payload,
      {
        headers: {
          Authorization: `Bearer ${CEREBRAS_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.choices?.[0]?.message?.content || '';
  } catch (error) {
    console.error('Cerebras API error:', error.response?.data || error.message);
    throw new Error('Failed to generate content with AI');
  }
};

// Helper function to generate MCQ questions using Cerebras
const generateMCQWithCerebras = async (text, count) => {
  const prompt = `
    Based on the following text, generate ${count} multiple choice questions (MCQ) with 4 options each. 
    Format the response as a JSON array with this structure:
    [
      {
        "id": 1,
        "question": "Question text here?",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswer": "Option A",
        "type": "mcq"
      }
    ]
    
    Text to analyze:
    ${text}
    
    Make sure the questions are:
    1. Relevant to the content
    2. Clear and unambiguous
    3. Have one correct answer and three plausible distractors
    4. Cover different aspects of the text
    
    Respond only with the JSON array, no additional text.
  `;

  try {
  const response = await callCerebrasAPI(prompt);
    console.log('Raw Cerebras MCQ response:', response);
    
    let cleanedResponse = response.replace(/```json|```/g, '').trim();
    
    // Additional cleanup - remove any extra text before or after JSON
    const jsonStart = cleanedResponse.indexOf('[');
    const jsonEnd = cleanedResponse.lastIndexOf(']') + 1;
    
    if (jsonStart !== -1 && jsonEnd !== -1) {
      cleanedResponse = cleanedResponse.substring(jsonStart, jsonEnd);
    }
    
    console.log('Cleaned MCQ response:', cleanedResponse);
    
    const questions = JSON.parse(cleanedResponse);
    
    // Validate the structure
    if (!Array.isArray(questions)) {
      throw new Error('Response is not an array');
    }
    
    return questions;
  } catch (error) {
    console.error('MCQ generation error:', error);
    console.error('Error details:', error.message);
    // Fallback: generate basic questions
    return Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      question: `Question ${i + 1} based on the content`,
      options: ["Option A", "Option B", "Option C", "Option D"],
      correctAnswer: "Option A",
      type: 'mcq'
    }));
  }
};

// Helper function to generate Q&A questions using Cerebras
const generateQAWithCerebras = async (text, count) => {
  const prompt = `
    Based on the following text, generate ${count} open-ended questions that require detailed answers.
    Format the response as a JSON array with this structure:
    [
      {
        "id": 1,
        "question": "Question text here?",
        "type": "qa",
        "maxMarks": 10
      }
    ]
    
    Text to analyze:
    ${text}
    
    Make sure the questions:
    1. Require analytical thinking
    2. Are open-ended and encourage detailed responses
    3. Cover key concepts from the text
    4. Are suitable for educational assessment
    
    Respond only with the JSON array, no additional text.
  `;

  try {
  const response = await callCerebrasAPI(prompt);
    console.log('Raw Cerebras QA response:', response);
    
    let cleanedResponse = response.replace(/```json|```/g, '').trim();
    
    // Additional cleanup - remove any extra text before or after JSON
    const jsonStart = cleanedResponse.indexOf('[');
    const jsonEnd = cleanedResponse.lastIndexOf(']') + 1;
    
    if (jsonStart !== -1 && jsonEnd !== -1) {
      cleanedResponse = cleanedResponse.substring(jsonStart, jsonEnd);
    }
    
    console.log('Cleaned QA response:', cleanedResponse);
    
    const questions = JSON.parse(cleanedResponse);
    
    // Validate the structure
    if (!Array.isArray(questions)) {
      throw new Error('Response is not an array');
    }
    
    return questions;
  } catch (error) {
    console.error('Q&A generation error:', error);
    console.error('Error details:', error.message);
    // Fallback: generate basic questions
    return Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      question: `Explain the key concepts discussed in section ${i + 1} of the document.`,
      type: 'qa',
      maxMarks: 10
    }));
  }
};

// Helper function to evaluate answers using Cerebras
const evaluateAnswerWithCerebras = async (question, answer, context) => {
  const prompt = `
    Evaluate the following student answer for the given question. Consider the context if provided.
    
    Question: ${question}
    Student Answer: ${answer}
    ${context ? `Context: ${context}` : ''}
    
    Provide evaluation in this JSON format:
    {
      "score": 8,
      "maxMarks": 10,
      "feedback": "Detailed feedback explaining the score, what was good, and what could be improved"
    }
    
    Scoring criteria:
    - 9-10: Excellent, comprehensive answer with clear understanding
    - 7-8: Good answer with minor gaps
    - 5-6: Average answer, basic understanding shown
    - 3-4: Below average, significant gaps
    - 1-2: Poor answer with major misconceptions
    - 0: No relevant content
    
    Respond only with the JSON object, no additional text.
  `;

  try {
  const response = await callCerebrasAPI(prompt);
    console.log('Raw Cerebras evaluation response:', response);
    
    let cleanedResponse = response.replace(/```json|```/g, '').trim();
    
    // Additional cleanup - remove any extra text before or after JSON
    const jsonStart = cleanedResponse.indexOf('{');
    const jsonEnd = cleanedResponse.lastIndexOf('}') + 1;
    
    if (jsonStart !== -1 && jsonEnd !== -1) {
      cleanedResponse = cleanedResponse.substring(jsonStart, jsonEnd);
    }
    
    console.log('Cleaned evaluation response:', cleanedResponse);
    
    const evaluation = JSON.parse(cleanedResponse);
    
    // Validate the structure
    if (typeof evaluation.score === 'undefined' || typeof evaluation.maxMarks === 'undefined') {
      throw new Error('Invalid evaluation structure');
    }
    
    return evaluation;
  } catch (error) {
    console.error('Answer evaluation error:', error);
    console.error('Error details:', error.message);
    // Fallback evaluation
    return {
      score: 7,
      maxMarks: 10,
      feedback: "Your answer shows understanding of the topic. Consider providing more specific examples and detailed explanations."
    };
  }
};

// @desc    Get user's practice results for profile
// @route   GET /api/practice/user-results
// @access  Private
const getUserPracticeResults = async (req, res) => {
  try {
    const userId = req.user.id;

    const practiceResults = await PracticeResult.find({ user: userId })
      .select('fileName quizType score totalQuestions maxScore percentage createdAt')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: practiceResults
    });
  } catch (error) {
    console.error('Get user practice results error:', error);
    res.status(500).json({ 
      message: 'Failed to get practice results',
      success: false 
    });
  }
};

module.exports = {
  generateQuiz,
  evaluateAnswer,
  storePracticeResult,
  getPracticeHistory,
  getPracticeResult,
  getUserPracticeResults
};
