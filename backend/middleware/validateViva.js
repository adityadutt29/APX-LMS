function validateVivaGeneration(req, res, next) {
  const { subject, topics, difficulty } = req.body;
  if (!subject || !topics || !difficulty) {
    return res.status(400).json({ success: false, message: 'All fields are required for viva generation.' });
  }
  next();
}

function validateAnswerSubmission(req, res, next) {
  const { question, correctAns, userAns } = req.body;
  if (!question || !correctAns || !userAns) {
    return res.status(400).json({ success: false, message: 'All fields are required for answer submission.' });
  }
  next();
}

module.exports = { validateVivaGeneration, validateAnswerSubmission };
