const PracticeResult = require('../models/PracticeResult');
const User = require('../models/Users');
const axios = require('axios');

// Cerebras AI configuration
const CEREBRAS_API_KEY = process.env.CEREBRAS_API_KEY || '';
const CEREBRAS_MODEL = process.env.CEREBRAS_MODEL || 'qwen-3-235b-a22b-instruct-2507';

// Robust JSON parsing helper used to recover valid JSON from noisy LLM outputs
function robustParseJSON(input) {
  if (!input || typeof input !== 'string') return null
  const attempts = []

  // raw
  attempts.push(input)

  // strip common fences and trim
  let s = input.replace(/```json|```/g, '').trim()
  attempts.push(s)

  // strip comments
  s = s.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '')
  attempts.push(s)

  // remove trailing commas
  s = s.replace(/,\s*([}\]])/g, '$1')
  attempts.push(s)

  // normalize smart quotes
  s = s.replace(/[\u2018\u2019\u201A\u201B]/g, "'").replace(/[\u201C\u201D\u201E\u201F]/g, '"')
  attempts.push(s)

  // quote unquoted keys
  s = s.replace(/([\{,\n\r\s])(\w[\w\d_-]*)\s*:/g, '$1"$2":')
  attempts.push(s)

  // convert single quotes to double
  s = s.replace(/'([^']*)'/g, '"$1"')
  attempts.push(s)

  for (const a of attempts) {
    try { return JSON.parse(a) } catch (err) { /* continue */ }
  }

  // As last resort, try to extract first {...} block
  const st = input.indexOf('{')
  const ed = input.lastIndexOf('}') + 1
  if (st !== -1 && ed !== 0) {
    try { return JSON.parse(input.substring(st, ed)) } catch (err) { /* give up */ }
  }

  return null
}

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

// @desc    Generate flashcards from extracted text
// @route   POST /api/practice/generate-flashcards
// @access  Private
const generateFlashcards = async (req, res) => {
  try {
    const { text, count } = req.body;
    if (!text) {
      return res.status(400).json({ message: 'Text is required' });
    }
    const flashcards = await generateFlashcardsWithCerebras(text, count || 10);
    res.json({ success: true, flashcards });
  } catch (error) {
    console.error('Flashcard generation error:', error);
    res.status(500).json({ message: 'Failed to generate flashcards' });
  }
};

// @desc    Generate mind map from extracted text
// @route   POST /api/practice/generate-mindmap
// @access  Private
const generateMindmap = async (req, res) => {
  try {
    const { text, maxNodes } = req.body;
    if (!text) {
      return res.status(400).json({ message: 'Text is required' });
    }
    const mindmap = await generateMindmapWithCerebras(text, maxNodes || 15);
    res.json({ success: true, mindmap });
  } catch (error) {
    console.error('Mindmap generation error:', error);
    res.status(500).json({ message: 'Failed to generate mind map' });
  }
};

// @desc    Generate detailed chapter-style notes from the provided text
// @route   POST /api/practice/generate-notes
// @access  Private
const generateNotes = async (req, res) => {
  try {
    const { text, sessionId, resultId, fileName, maxChapters } = req.body;
    if (!text) return res.status(400).json({ message: 'Text is required' });

    const chapters = maxChapters || 5;
    const prompt = `You are an expert educational content creator specializing in creating comprehensive, in-depth study materials. Generate extremely detailed, well-structured study notes from the following material. Format as JSON with this exact structure:
{
  "title": "Main topic title",
  "introduction": "4-6 paragraph detailed introduction explaining context, importance, historical background, and key concepts",
  "chapters": [
    {
      "number": 1,
      "title": "Chapter Title",
      "topics": ["Short topic/subtopic labels (4-8 items)"] ,
      "content": "Extremely detailed explanation (600-1000 words) with proper paragraphs separated by \n\n. Include analysis, multiple perspectives, detailed explanations of concepts, step-by-step breakdowns, and thorough coverage of all aspects (keep this length guidance unchanged)",
      "keyPoints": [
         "Concise key point 1 with 1-2 sentence explanation (max 20 words)",
         "Concise key point 2 with 1-2 sentence explanation (max 20 words)",
         "Concise key point 3 with 1-2 sentence explanation (max 20 words)",
         "Concise key point 4 with 1-2 sentence explanation (max 20 words)",
         "Concise key point 5 with 1-2 sentence explanation (max 20 words)",
         "Concise key point 6 with 1-2 sentence explanation (max 20 words)"
      ],
      "examples": ["Detailed concrete example with full explanation and analysis", "Another comprehensive example with step-by-step walkthrough"]
      }
    ],
  "conclusion": "4-6 paragraph comprehensive summary tying all concepts together, discussing implications, applications, and future directions",
  "references": ["Key concept or term 1 with brief definition", "Key concept or term 2 with brief definition", "Important principle or formula"]
}

Limit chapters to ${chapters}. Keep the per-chapter content length guidance the same as before; however, include a short "topics" list (4-8 concise subtopic labels) per chapter and expand "keyPoints" to 6 concise points with brief explanations (max ~20 words each). Prioritize clarity and topical coverage — more distinct points/topics without increasing the recommended chapter length. Use \n\n for paragraph breaks. 

IMPORTANT: For mathematical formulas, use plain Unicode symbols (×, ÷, ², ³, √, ∑, ∫, π, etc.) or simple notation like (a+b)/c or x^2 instead of LaTeX. Avoid \\frac, \\sum, etc. Make formulas readable as plain text. Output only valid JSON, no markdown.

SOURCE MATERIAL:
${text}`;

    let raw = await callCerebrasAPI(prompt, { max_completion_tokens: 8000 });
    raw = raw.replace(/```json|```/g, '').trim();
    const start = raw.indexOf('{'); const end = raw.lastIndexOf('}') + 1;
    if (start !== -1 && end !== 0) raw = raw.substring(start, end);

    // Try robust parsing first (handles trailing commas, comments, smart quotes, etc.)
    let parsed = robustParseJSON(raw);
    if (parsed) {
      parsed.generatedAt = new Date();
    } else {
      // If robust parse failed, log a short sample of raw output for debugging and fallback
      console.error('Notes parse failed, creating fallback: could not recover JSON. Raw sample:', raw.substring(0, 2000))
      // Fallback: create basic structure
      const sentences = text.split(/(?<=[.!?])\s+/).filter(s => s.trim());
      parsed = {
        title: 'Study Notes',
        introduction: sentences.slice(0, 3).join(' '),
        chapters: [{
          number: 1,
          title: 'Main Content',
          content: sentences.slice(3, 20).join(' '),
          keyPoints: sentences.slice(0, 5),
          examples: []
        }],
        conclusion: sentences.slice(-2).join(' '),
        references: [],
        generatedAt: new Date()
      };
    }

    // Persist notes to PracticeResult if identifiers provided
    let savedTo = null;
    try {
      const userId = req.user && req.user.id;
      if (resultId) {
        const doc = await PracticeResult.findById(resultId);
        if (doc && String(doc.user) === String(userId)) {
          doc.notes = parsed;
          await doc.save();
          savedTo = doc._id;
        }
      } else if (sessionId) {
        const doc = await PracticeResult.findOne({ user: userId, sessionId });
        if (doc) {
          doc.notes = parsed;
          await doc.save();
          savedTo = doc._id;
        }
      } else if (fileName) {
        const doc = await PracticeResult.findOne({ user: userId, fileName }).sort({ updatedAt: -1 });
        if (doc) {
          doc.notes = parsed;
          await doc.save();
          savedTo = doc._id;
        }
      }
    } catch (err) {
      console.warn('Failed to persist notes:', err.message);
    }

    res.json({ success: true, notes: parsed, savedTo });
  } catch (error) {
    console.error('Notes generation error:', error);
    res.status(500).json({ message: 'Failed to generate notes' });
  }
};

// @desc    Generate a detailed summary of the provided text and persist it to the nearest practice result when possible
// @route   POST /api/practice/generate-summary
// @access  Private
const generateSummary = async (req, res) => {
  try {
    const { text, maxSections, sessionId, resultId, fileName } = req.body;
    if (!text) return res.status(400).json({ message: 'Text is required' });

    const sections = maxSections || 6;
    // Detailed summary prompt: overview, key points, breakdown, examples, study tips
    const prompt = `You are an educational assistant. Produce a detailed structured summary for the following learning material. Deliver a JSON object with these fields: {"overview":"<one paragraph overview>","keyPoints":["short bullet points (max 25 words each)"],"sections":[{"title":"Section title","summary":"one concise paragraph (<=40 words)"}],"examples":["concise example lines (optional)"],"studyTips":"one-sentence practical tip","insight":"one-sentence key insight"}. Limit keyPoints to ${Math.max(4, sections)} items and sections to ${sections}. Output only JSON, no commentary.\n\nSOURCE:\n${text}`;

    let raw = await callCerebrasAPI(prompt, { max_completion_tokens: 1600 });
    raw = raw.replace(/```json|```/g, '').trim();
    const start = raw.indexOf('{'); const end = raw.lastIndexOf('}') + 1; if (start !== -1 && end !== 0) raw = raw.substring(start, end);

    // Robust JSON parsing: attempt several cleanup heuristics to recover valid JSON from LLM output
    const tryParseJSON = (input) => {
      const attempts = []

      // raw attempt
      attempts.push(input)

      // 1) remove JS/Markdown fences and trim
      let s = input.replace(/```json|```/g, '').trim()
      attempts.push(s)

      // 2) strip single-line (//) and block (/* */) comments
      s = s.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '')
      attempts.push(s)

      // 3) remove trailing commas before } or ]
      s = s.replace(/,\s*([}\]])/g, '$1')
      attempts.push(s)

      // 4) normalize smart quotes to straight quotes
      s = s.replace(/[\u2018\u2019\u201A\u201B]/g, "'").replace(/[\u201C\u201D\u201E\u201F]/g, '"')
      attempts.push(s)

      // 5) ensure object keys are quoted (convert bareword keys like key: to "key":)
      s = s.replace(/([\{,\n\r\s])(\w[\w\d_-]*)\s*:/g, '$1"$2":')
      attempts.push(s)

      // 6) convert single-quoted strings to double-quoted (best-effort)
      s = s.replace(/'([^']*)'/g, '"$1"')
      attempts.push(s)

      // Try progressively to parse each attempt
      for (const a of attempts) {
        try {
          return JSON.parse(a)
        } catch (err) {
          // continue to next attempt
        }
      }

      // Last resort: try to extract first {...} block and parse again
      const st = input.indexOf('{')
      const ed = input.lastIndexOf('}') + 1
      if (st !== -1 && ed !== 0) {
        const sub = input.substring(st, ed)
        try {
          return JSON.parse(sub)
        } catch (err) {
          // give up
        }
      }

      return null
    }

    let parsed = tryParseJSON(raw)
    if (!parsed) {
      console.error('Summary parse failed, falling back: could not recover JSON')
      // fallback: split into bullets and insight
      const sentences = text.split(/(?<=[.!?])\s+/).filter(s => s.trim())
      const bullets = sentences.slice(0, Math.min(6, sentences.length))
      parsed = { overview: bullets.slice(0, 2).join(' '), keyPoints: bullets, sections: [], examples: [], studyTips: '', insight: bullets[0] || 'Key ideas extracted.' }
    }

    // Attempt to persist summary to a PracticeResult document if we can identify one
    let savedTo = null;
    try {
      const userId = req.user && req.user.id;
      if (resultId) {
        const doc = await PracticeResult.findById(resultId);
        if (doc && String(doc.user) === String(userId)) {
          doc.summary = parsed;
          await doc.save();
          savedTo = doc._id;
        }
      } else if (sessionId) {
        const doc = await PracticeResult.findOne({ user: userId, sessionId });
        if (doc) {
          doc.summary = parsed;
          await doc.save();
          savedTo = doc._id;
        }
      } else if (fileName) {
        // find most recent practice result for this user+fileName
        const doc = await PracticeResult.findOne({ user: userId, fileName }).sort({ updatedAt: -1 });
        if (doc) {
          doc.summary = parsed;
          await doc.save();
          savedTo = doc._id;
        }
      }
    } catch (err) {
      console.warn('Failed to persist summary:', err.message);
    }

    res.json({ success: true, summary: parsed, savedTo });
  } catch (error) {
    console.error('Summary generation error:', error);
    res.status(500).json({ message: 'Failed to generate summary' });
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
      percentage,
      summary
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
      percentage,
      summary: (summary && typeof summary === 'object') ? summary : undefined
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

// @desc    Create (or reuse) an incomplete practice session stub
// @route   POST /api/practice/sessions/init
// @access  Private
const initPracticeSession = async (req, res) => {
  try {
    const userId = req.user.id;
    const { fileName, extractedText } = req.body;
    if (!fileName || !extractedText) {
      return res.status(400).json({ message: 'fileName and extractedText are required' });
    }

    // Dedup: find an existing incomplete session with same hash signature (short) within last 10 minutes
    const signature = `${fileName}::${(extractedText||'').slice(0,120)}`;
    const sessionId = Buffer.from(signature).toString('base64').slice(0,40);

    let existing = await PracticeResult.findOne({ user: userId, sessionId, status: 'incomplete' }).sort({ createdAt: -1 });
    if (existing) {
      return res.json({ success: true, reused: true, data: existing });
    }

    const stub = new PracticeResult({
      user: userId,
      sessionId,
      fileName,
      quizType: undefined,
      extractedText,
      questions: [],
      userAnswers: [],
      score: 0,
      totalQuestions: 0,
      maxScore: 0,
      percentage: 0,
      status: 'incomplete'
    });
    await stub.save();
    res.status(201).json({ success: true, reused: false, data: stub });
  } catch (error) {
    console.error('Init practice session error:', error);
    res.status(500).json({ message: 'Failed to init practice session' });
  }
};

// @desc    Finalize practice session (update stub -> completed)
// @route   PATCH /api/practice/sessions/:sessionId/finalize
// @access  Private
const finalizePracticeSession = async (req, res) => {
  try {
    const userId = req.user.id;
    const { sessionId } = req.params;
  const { quizType, questions, userAnswers, score, summary } = req.body;
    if (!sessionId) return res.status(400).json({ message: 'sessionId required' });

    const doc = await PracticeResult.findOne({ user: userId, sessionId });
    if (!doc) return res.status(404).json({ message: 'Session not found' });

    const totalQuestions = Array.isArray(questions) ? questions.length : 0;
    const maxScore = quizType === 'mcq' ? totalQuestions : totalQuestions * 10;
    const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

    doc.quizType = quizType || doc.quizType;
    doc.questions = Array.isArray(questions) ? questions : doc.questions;
    doc.userAnswers = Array.isArray(userAnswers) ? userAnswers : doc.userAnswers;
    doc.score = typeof score === 'number' ? score : doc.score;
    doc.totalQuestions = totalQuestions;
    doc.maxScore = maxScore;
    doc.percentage = percentage;
    doc.status = 'completed';
    doc.completedAt = new Date();
    if (summary && typeof summary === 'object') {
      doc.summary = summary; // allow passing summary at finalize
    }

    await doc.save();
    res.json({ success: true, data: doc, message: 'Session finalized' });
  } catch (error) {
    console.error('Finalize practice session error:', error);
    res.status(500).json({ message: 'Failed to finalize practice session' });
  }
};

// @desc    Update flashcard or mindmap generation state for an incomplete session
// @route   PATCH /api/practice/sessions/:sessionId/progress
// @access  Private
const updatePracticeSessionProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { sessionId } = req.params;
    const { flashcardCount, mindmapGenerated } = req.body;
    if (!sessionId) return res.status(400).json({ message: 'sessionId required' });
    const doc = await PracticeResult.findOne({ user: userId, sessionId });
    if (!doc) return res.status(404).json({ message: 'Session not found' });
    if (typeof flashcardCount === 'number') doc.flashcardCount = flashcardCount;
    if (typeof mindmapGenerated === 'boolean') doc.mindmapGenerated = mindmapGenerated;
    await doc.save();
    res.json({ success: true, data: doc, message: 'Session progress updated' });
  } catch (error) {
    console.error('Update practice session progress error:', error);
    res.status(500).json({ message: 'Failed to update practice session progress' });
  }
};

// @desc    Archive stale incomplete sessions older than given minutes (default 60)
// @route   POST /api/practice/sessions/archive-stale
// @access  Private
const archiveStalePracticeSessions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { minutes = 60 } = req.body;
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    const result = await PracticeResult.updateMany(
      { user: userId, status: 'incomplete', createdAt: { $lt: cutoff } },
      { $set: { status: 'archived', archivedAt: new Date() } }
    );
    res.json({ success: true, archived: result.modifiedCount, minutes });
  } catch (error) {
    console.error('Archive stale sessions error:', error);
    res.status(500).json({ message: 'Failed to archive stale sessions' });
  }
};

// @desc    Get user's practice history
// @route   GET /api/practice/history
// @access  Private
const getPracticeHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    // Pagination & filtering
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const includeArchived = req.query.includeArchived === 'true';

    const filter = { user: userId };
    if (!includeArchived) filter.status = { $ne: 'archived' };

    const totalCount = await PracticeResult.countDocuments(filter);
    const practiceResults = await PracticeResult.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('user', 'name email');

    // Map results to use percentage for quizzes/practice
    const mappedResults = practiceResults.map(result => {
      const obj = result.toObject();
      // For practice/quiz results, use percentage as the primary score
      if (obj.quizType === 'mcq' || obj.quizType === 'qa' || obj.quizType === 'practice') {
        obj.score = obj.percentage;
      }
      return obj;
    });

    res.json({
      success: true,
      data: mappedResults,
      count: mappedResults.length,
      totalCount,
      page,
      limit
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

    // Map result to use percentage for quizzes/practice
    const obj = practiceResult.toObject();
    if (obj.quizType === 'mcq' || obj.quizType === 'qa' || obj.quizType === 'practice') {
      obj.score = obj.percentage;
    }

    res.json({
      success: true,
      data: obj
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
    Analyze the following text and generate ${count} multiple choice questions (MCQ) with 4 options each. 
    Each question should be specific, relevant, and based on important facts, concepts, or details from the text. 
    Format the response as a JSON array with this structure:
    [
      {
        "id": 1,
        "question": "What is ...?",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswer": "Option A",
        "type": "mcq"
      }
    ]

    Text to analyze:
    ${text}

    Guidelines:
    - Questions must be clear, unambiguous, and based on the text.
    - Each question should test understanding of a key point or fact.
    - Options should be plausible, with only one correct answer.
    - Do not use generic placeholders. Do not repeat questions.
    - Respond ONLY with the JSON array, no extra text or formatting.
  `;

  try {
    const response = await callCerebrasAPI(prompt);
    console.log('Raw Cerebras MCQ response:', response);

    // Try to extract the first valid JSON array from the response
    let cleanedResponse = response.replace(/```json|```/g, '').trim();
    const match = cleanedResponse.match(/\[.*\]/s);
    if (match) {
      cleanedResponse = match[0];
    }
    console.log('Cleaned MCQ response:', cleanedResponse);

    const questions = JSON.parse(cleanedResponse);
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

// Helper function to generate flashcards using Cerebras
const generateFlashcardsWithCerebras = async (text, count) => {
  const prompt = `
    Analyze the following text and generate ${count} flashcards. Each flashcard should have a question and a concise answer, focusing on key facts, definitions, or concepts from the text. 
    Format the response as a JSON array with this structure:
    [
      {
        "id": 1,
        "front": "What is ...?",
        "back": "...",
        "type": "flashcard"
      }
    ]

    Text to analyze:
    ${text}

    Guidelines:
    - Each flashcard should cover an important point from the text.
    - Answers should be clear and concise.
    - Do not use generic placeholders. Do not repeat questions.
    - Respond ONLY with the JSON array, no extra text or formatting.
  `;

  try {
    const response = await callCerebrasAPI(prompt);
    console.log('Raw Cerebras flashcard response:', response);

    // Try to extract the first valid JSON array from the response
    let cleanedResponse = response.replace(/```json|```/g, '').trim();
    const match = cleanedResponse.match(/\[.*\]/s);
    if (match) {
      cleanedResponse = match[0];
    }
    console.log('Cleaned flashcard response:', cleanedResponse);

    const flashcards = JSON.parse(cleanedResponse);
    if (!Array.isArray(flashcards)) {
      throw new Error('Response is not an array');
    }
    // Ensure front/back keys
    return flashcards.map(card => ({
      front: card.question || card.front,
      back: card.answer || card.back
    }));
  } catch (error) {
    console.error('Flashcard generation error:', error);
    console.error('Error details:', error.message);
    // Fallback: generate basic flashcards
    return Array.from({ length: count }, (_, i) => ({
      front: `Key fact ${i + 1} from the content`,
      back: `Answer for key fact ${i + 1}`
    }));
  }
};

// Helper function to generate a mind map JSON using Cerebras
const generateMindmapWithCerebras = async (text, maxNodes) => {
  const prompt = `
    Analyze the following educational content and create a DEEP hierarchical mind map capturing:
    - The main topic (single root)
    - Key subtopics
    - Important supporting concepts / definitions under each subtopic

    Return ONLY a JSON object with this exact structure (no markdown fences, no prose):
    {
      "title": "Overall Topic Title",
      "nodes": [
        { "id": "root", "label": "Root Topic", "parentId": null, "data": { "description": "Concise definition (<=30 words) of the overall topic." } },
        { "id": "n1", "label": "Subtopic 1", "parentId": "root", "data": { "description": "Definition or role of Subtopic 1 (<=30 words)." } },
        { "id": "n1a", "label": "Supporting Concept", "parentId": "n1", "data": { "description": "Short explanation (<=25 words)." } }
      ],
      "connections": [
        { "source": "n1", "target": "n2", "label": "related" }
      ]
    

    RULES:
    - Maximum ${maxNodes} nodes TOTAL (root included).
    - Every node MUST include a data.description field (1 sentence, <= 30 words, no lists, no quotes at start/end).
    - Labels: Title Case, max 6 words, no punctuation at end.
    - Exactly one root where parentId is null.
    - Use cross-link connections only when two subtopics have a meaningful relationship (optional).
    - Output MUST be pure JSON (no commentary, no backticks).
    - Do NOT exceed the node cap: if content is large, prioritize most central concepts.

    SOURCE CONTENT:
    ${text}
  `;
  try {
    const response = await callCerebrasAPI(prompt, { max_completion_tokens: 2048 });
    let cleaned = response.replace(/```json|```/g, '').trim();
    const objStart = cleaned.indexOf('{');
    const objEnd = cleaned.lastIndexOf('}') + 1;
    if (objStart !== -1 && objEnd !== -1) {
      cleaned = cleaned.substring(objStart, objEnd);
    }
    const parsed = JSON.parse(cleaned);
    if (!parsed.nodes || !Array.isArray(parsed.nodes)) throw new Error('Invalid mindmap structure');
    // Basic normalization
    parsed.nodes = parsed.nodes.map(n => ({
      id: n.id || n.label,
      label: n.label || n.id,
      parentId: n.parentId ?? null,
      data: n.data || { description: (n.description || '').toString().slice(0, 280) }
    }));
    parsed.connections = Array.isArray(parsed.connections) ? parsed.connections : [];
    return parsed;
  } catch (error) {
    console.error('Mindmap generation fallback due to error:', error.message);
    // Fallback simple mind map from top sentences
    const sentences = text.split(/\n+|\.\s+/).filter(s => s.trim());
    const limited = sentences.slice(0, Math.min(5, maxNodes - 1));
    const nodes = [{ id: 'root', label: 'Content Summary', parentId: null, data: { description: 'Root summary of provided content.' } }];
    limited.forEach((s, i) => nodes.push({
      id: `n${i+1}`,
      label: s.trim().slice(0, 40),
      parentId: 'root',
      data: { description: s.trim().slice(0, 200) }
    }));
    return { title: 'Generated Mind Map', nodes, connections: [] };
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

    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const includeArchived = req.query.includeArchived === 'true';
    const filter = { user: userId };
    if (!includeArchived) filter.status = { $ne: 'archived' };

    const totalCount = await PracticeResult.countDocuments(filter);
    const practiceResults = await PracticeResult.find(filter)
      .select('fileName quizType score totalQuestions maxScore percentage createdAt sessionId status flashcardCount mindmapGenerated')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // Map results to use percentage for quizzes/practice
    const mappedResults = practiceResults.map(result => {
      const obj = result.toObject();
      // For practice/quiz results, use percentage as the primary score
      if (obj.quizType === 'mcq' || obj.quizType === 'qa' || obj.quizType === 'practice') {
        obj.score = obj.percentage;
      }
      return obj;
    });

    res.json({
      success: true,
      data: mappedResults,
      count: mappedResults.length,
      totalCount,
      page,
      limit
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
  generateFlashcards,
  generateMindmap,
  generateSummary,
  generateNotes,
  evaluateAnswer,
  storePracticeResult,
  getPracticeHistory,
  getPracticeResult,
  getUserPracticeResults,
  initPracticeSession,
  finalizePracticeSession,
  updatePracticeSessionProgress
  ,archiveStalePracticeSessions
  ,deletePracticeResult
  ,deletePracticePack
  ,restorePracticeResult
  ,restorePracticePack
  ,renamePracticePack
};

// @desc    Delete a single practice result by id
// @route   DELETE /api/practice/results/:id
// @access  Private
async function deletePracticeResult(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: 'Result id required' });
    const doc = await PracticeResult.findOne({ _id: id, user: userId });
    if (!doc) return res.status(404).json({ message: 'Practice result not found' });
    if (doc.status === 'archived') return res.json({ success: true, archived: true, id });
    doc.status = 'archived';
    doc.archivedAt = new Date();
    await doc.save();
    res.json({ success: true, archived: true, id });
  } catch (error) {
    console.error('Delete practice result error:', error);
    res.status(500).json({ message: 'Failed to delete practice result' });
  }
}

// @desc    Delete all practice results for a given fileName (study pack)
// @route   DELETE /api/practice/packs/:fileName
// @access  Private
async function deletePracticePack(req, res) {
  try {
    const userId = req.user.id;
    const raw = req.params.fileName || '';
    const fileName = decodeURIComponent(raw);
    if (!fileName) return res.status(400).json({ message: 'fileName required' });
    const result = await PracticeResult.updateMany({ user: userId, fileName, status: { $ne: 'archived' } }, { $set: { status: 'archived', archivedAt: new Date() } });
    res.json({ success: true, archived: result.modifiedCount, fileName });
  } catch (error) {
    console.error('Delete practice pack error:', error);
    res.status(500).json({ message: 'Failed to delete practice pack' });
  }
}

// Restore a single archived practice result
// @route   PATCH /api/practice/results/:id/restore
// @access  Private
async function restorePracticeResult(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: 'Result id required' });
    const doc = await PracticeResult.findOne({ _id: id, user: userId });
    if (!doc) return res.status(404).json({ message: 'Practice result not found' });
    doc.status = 'completed';
    doc.archivedAt = undefined;
    await doc.save();
    res.json({ success: true, restored: true, id });
  } catch (error) {
    console.error('Restore practice result error:', error);
    res.status(500).json({ message: 'Failed to restore practice result' });
  }
}

// Restore all attempts for a study pack
// @route   PATCH /api/practice/packs/:fileName/restore
// @access  Private
async function restorePracticePack(req, res) {
  try {
    const userId = req.user.id;
    const raw = req.params.fileName || '';
    const fileName = decodeURIComponent(raw);
    if (!fileName) return res.status(400).json({ message: 'fileName required' });
    const result = await PracticeResult.updateMany({ user: userId, fileName, status: 'archived' }, { $set: { status: 'completed' }, $unset: { archivedAt: '' } });
    res.json({ success: true, restored: result.modifiedCount, fileName });
  } catch (error) {
    console.error('Restore practice pack error:', error);
    res.status(500).json({ message: 'Failed to restore practice pack' });
  }
}

// Rename a study pack across PracticeResult and Flashcards for the current user
// @route PATCH /api/practice/packs/:fileName/rename
// @access Private
async function renamePracticePack(req, res) {
  try {
    const userId = req.user.id;
    const raw = req.params.fileName || '';
    const oldName = decodeURIComponent(raw);
    const { newName } = req.body;
    if (!oldName || !newName) return res.status(400).json({ message: 'fileName and newName are required' });

    // Update practice results
    const prRes = await PracticeResult.updateMany({ user: userId, fileName: oldName }, { $set: { fileName: newName } });

    // Update flashcards
    const Flashcard = require('../models/Flashcard');
    const fcRes = await Flashcard.updateMany({ user: userId, packName: oldName }, { $set: { packName: newName } });

    const prCount = prRes.modifiedCount ?? prRes.nModified ?? 0;
    const fcCount = fcRes.modifiedCount ?? fcRes.nModified ?? 0;

    res.json({ success: true, practiceResultsUpdated: prCount, flashcardsUpdated: fcCount });
  } catch (error) {
    console.error('Rename practice pack error:', error);
    res.status(500).json({ message: 'Failed to rename practice pack' });
  }
}
