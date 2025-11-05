exports.validateVivaGeneration = (req, res, next) => {
  const { subject, topics, difficulty } = req.body;

  if (!subject || !topics || !difficulty) {
    return res.status(400).json({
      success: false,
      message: 'Subject, topics, and difficulty are required'
    });
  }

  if (!['easy', 'medium', 'hard'].includes(difficulty.toLowerCase())) {
    return res.status(400).json({
      success: false,
      message: 'Difficulty must be easy, medium, or hard'
    });
  }

  next();
};

exports.validateAnswerSubmission = (req, res, next) => {
  const { question, userAns } = req.body;

  if (!question || !userAns) {
    return res.status(400).json({
      success: false,
      message: 'Question and user answer are required'
    });
  }

  next();
};
