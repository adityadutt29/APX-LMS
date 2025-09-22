
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

// Configure CORS properly
const corsOptions = {
  origin: 'http://localhost:3000',
  methods: ['POST', 'OPTIONS'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

// Add OPTIONS handler for preflight
app.options('/generateQuiz', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.sendStatus(200);
});

// Your existing POST endpoint
app.post('/generateQuiz', async (req, res) => {
  const { topic } = req.body;
  
  // Validate input
  if (!topic) {
    return res.status(400).json({ error: 'Topic is required.' });
  }

  const questionsCount = 10;

  // Build the structured request
  const requestData = {
    contents: [
      {
        parts: [{ text: `Generate a quiz with ${questionsCount} questions about "${topic}". 
Each question should be formatted as JSON with the following keys: 
"question": a string containing the quiz question, 
"options": an array of 4 strings (possible answers), and 
"correctAnswer": a string with the correct answer.
Output the quiz as a JSON array of questions.` }]
      }
    ]
  };

  try {
    const CEREBRAS_API_KEY = process.env.CEREBRAS_API_KEY || '';
    const model = process.env.CEREBRAS_MODEL || 'qwen-3-235b-a22b-instruct-2507';

    const resp = await axios.post(
      'https://api.cerebras.ai/v1/chat/completions',
      {
        model,
        messages: [{ role: 'user', content: requestData.contents[0].parts[0].text }],
      },
      {
        headers: {
          Authorization: `Bearer ${CEREBRAS_API_KEY}`,
          'Content-Type': 'application/json',
        }
      }
    );

    const responseData = resp.data;

    const text = responseData.choices?.[0]?.message?.content || '';
    const quizText = text.replace(/```json|```/g, '').trim();

    try {
      const quiz = JSON.parse(quizText);
      res.json(quiz);
    } catch (parseError) {
      console.error('Error parsing Cerebras response:', parseError);
      res.status(500).json({ error: 'Failed to parse quiz data.', rawResponse: quizText });
    }

  } catch (error) {
    console.error('Error generating quiz:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to generate quiz.' });
  }
});

// Add chat endpoint OPTIONS handler
app.options('/chat', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.sendStatus(200);
});

// Add chat endpoint
app.post('/chat', async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required.' });
  }

  const requestData = {
    contents: [
      {
        parts: [{ text: message }]
      }
    ]
  };
  try {
    const CEREBRAS_API_KEY = process.env.CEREBRAS_API_KEY || '';
    const model = process.env.CEREBRAS_MODEL || 'qwen-3-235b-a22b-instruct-2507';

    const resp = await axios.post(
      'https://api.cerebras.ai/v1/chat/completions',
      {
        model,
        messages: [{ role: 'user', content: requestData.contents[0].parts[0].text }]
      },
      {
        headers: {
          Authorization: `Bearer ${CEREBRAS_API_KEY}`,
          'Content-Type': 'application/json',
        }
      }
    );

    const responseData = resp.data;
    const responseText = responseData.choices?.[0]?.message?.content || '';
    res.json({ response: responseText });
  
  } catch (error) {
    console.error('Error in chat:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to generate response.' });
  }
});

// Start server on 3001
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Quiz API server running on port ${PORT}`);
});