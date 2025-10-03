const axios = require('axios');

class CerebrasService {
  constructor() {
    const apiKey = process.env.CEREBRAS_API_KEY;
    if (!apiKey) {
      throw new Error('CEREBRAS_API_KEY is required');
    }

    this.apiKey = apiKey;
    this.baseUrl = process.env.CEREBRAS_API_BASE || 'https://api.cerebras.ai/v1';
    this.defaultModel = process.env.CEREBRAS_MODEL || 'qwen-3-235b-a22b-instruct-2507';
  }

  async _chatCompletion(payload) {
    const url = `${this.baseUrl}/chat/completions`;
    try {
      const resp = await axios.post(url, payload, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      return resp.data;
    } catch (error) {
      console.error('Cerebras API error:', error.response?.data || error.message);
      throw error;
    }
  }

  // AI assistant for education: answers only education-related questions
  async aiAssistant(prompt, options = {}) {
    // System prompt to restrict answers to education/career topics
    const systemPrompt = "You are an AI assistant for students. Only answer questions related to education, career guidance, study techniques, interview preparation, academic stress, or course selection. If asked about anything else, reply: 'I am not trained for that.'";
    const payload = {
      model: options.model || this.defaultModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: typeof options.temperature !== 'undefined' ? options.temperature : 0.7,
      top_p: typeof options.top_p !== 'undefined' ? options.top_p : 0.95,
      max_completion_tokens: options.max_completion_tokens || 1024,
    };
    if (options.response_format) payload.response_format = options.response_format;
    const data = await this._chatCompletion(payload);
    const text = data.choices?.[0]?.message?.content || '';
    return text;
  }

  // Legacy chat method (unrestricted)
  async chat(prompt, options = {}) {
    const payload = {
      model: options.model || this.defaultModel,
      messages: [{ role: 'user', content: prompt }],
      temperature: typeof options.temperature !== 'undefined' ? options.temperature : 0.7,
      top_p: typeof options.top_p !== 'undefined' ? options.top_p : 0.95,
      max_completion_tokens: options.max_completion_tokens || 2048,
    };
    if (options.response_format) payload.response_format = options.response_format;
    const data = await this._chatCompletion(payload);
    const text = data.choices?.[0]?.message?.content || '';
    return text;
  }

  // Generate academic viva questions - enforce JSON array items {question, answer}
  async generateVivaQuestions(subject, topics, difficulty, questionCount = 5) {
    try {
      const prompt = `Subject: ${subject}, Topics: ${topics}, Difficulty: ${difficulty}. Based on these, generate ${questionCount} academic viva questions with answers.`;

      const itemSchema = {
        type: 'object',
        properties: {
          question: { type: 'string' },
          answer: { type: 'string' }
        },
        required: ['question', 'answer']
      };

      const schema = {
        type: 'object',
        properties: {
          questions: { type: 'array', items: itemSchema }
        },
        required: ['questions']
      };

      const response_format = {
        type: 'json_schema',
        json_schema: { name: 'viva_questions', strict: true, schema }
      };

      const payload = {
        model: this.defaultModel,
        messages: [{ role: 'user', content: prompt }],
        response_format,
        temperature: 0.8,
        top_p: 0.95,
        max_completion_tokens: 2048,
      };

      const data = await this._chatCompletion(payload);
      const text = data.choices?.[0]?.message?.content || '';
      const cleaned = text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed)) return parsed;
      if (parsed && Array.isArray(parsed.questions)) return parsed.questions;
      throw new Error('Unexpected viva questions format');
    } catch (error) {
      console.error('Error generating viva questions:', error);
      throw new Error('Failed to generate viva questions');
    }
  }

  // Generate feedback - enforce object {rating:number, feedback:string}
  async generateFeedback(question, userAnswer, correctAnswer) {
    try {
      const prompt = `Question: ${question}\nCorrect Answer: ${correctAnswer}\nUser Answer: ${userAnswer}\nProvide a numeric rating out of 10 as \"rating\" and a short feedback as \"feedback\".`;

      const schema = {
        type: 'object',
        properties: {
          rating: { type: 'number' },
          feedback: { type: 'string' }
        },
        required: ['rating', 'feedback']
      };

      const response_format = {
        type: 'json_schema',
        json_schema: { name: 'feedback', strict: true, schema }
      };

      const payload = {
        model: this.defaultModel,
        messages: [{ role: 'user', content: prompt }],
        response_format,
        temperature: 0.6,
        top_p: 0.95,
        max_completion_tokens: 256,
      };

      const data = await this._chatCompletion(payload);
      const text = data.choices?.[0]?.message?.content || '';
      const cleaned = text.replace(/```json|```/g, '').trim();
      return JSON.parse(cleaned);
    } catch (error) {
      console.error('Error generating feedback:', error);
      throw new Error('Failed to generate feedback');
    }
  }

  // Generate flowchart data - enforce nodes/edges shapes
  async generateFlowchartData(code, language) {
    try {
      const prompt = `Analyze the following ${language} code and generate a flowchart JSON with \"nodes\" and \"edges\" arrays suitable for React Flow.\n\nCode:\n\`\`\`${language}\n${code}\n\`\`\`\nReturn ONLY valid JSON.`;

      const nodeSchema = {
        type: 'object',
        properties: {
          id: { type: 'string' },
          type: { type: 'string' },
          data: { type: 'object', properties: { label: { type: 'string' } }, required: ['label'] },
          position: { type: 'object', properties: { x: { type: 'number' }, y: { type: 'number' } }, required: ['x', 'y'] }
        },
        required: ['id', 'type', 'data', 'position']
      };

      const edgeSchema = {
        type: 'object',
        properties: {
          id: { type: 'string' },
          source: { type: 'string' },
          target: { type: 'string' },
          animated: { type: 'boolean' },
          label: { type: 'string' }
        },
        required: ['id', 'source', 'target']
      };

      const schema = {
        type: 'object',
        properties: {
          nodes: { type: 'array', items: nodeSchema },
          edges: { type: 'array', items: edgeSchema }
        },
        required: ['nodes', 'edges']
      };

      const response_format = {
        type: 'json_schema',
        json_schema: { name: 'flowchart', strict: true, schema }
      };

      const payload = {
        model: this.defaultModel,
        messages: [{ role: 'user', content: prompt }],
        response_format,
        temperature: 0.4,
        top_p: 0.95,
        max_completion_tokens: 4096,
      };

      const data = await this._chatCompletion(payload);
      const text = data.choices?.[0]?.message?.content || '';
      console.log('Raw Cerebras flowchart output:', text);
      const cleaned = text.replace(/```json|```/g, '').trim();
      let flowchart;
      try {
        flowchart = JSON.parse(cleaned);
      } catch (e) {
        console.warn('Cerebras output not valid JSON, fallback', e);
        flowchart = {};
      }

      // Ensure nodes/edges minimal fallback (same behaviour as before)
      if (!flowchart.nodes || !Array.isArray(flowchart.nodes) || flowchart.nodes.length === 0) {
        flowchart.nodes = [
          { id: '1', type: 'input', data: { label: 'Start' }, position: { x: 250, y: 0 } },
          { id: '2', type: 'output', data: { label: 'End' }, position: { x: 250, y: 120 } }
        ];
      }
      if (!flowchart.edges || !Array.isArray(flowchart.edges) || flowchart.edges.length === 0) {
        flowchart.edges = [
          { id: 'e1-2', source: '1', target: '2', animated: false, label: '' }
        ];
      }

      return flowchart;
    } catch (error) {
      console.error('Error generating flowchart data:', error);
      return {
        nodes: [
          { id: '1', type: 'input', data: { label: 'Start' }, position: { x: 250, y: 0 } },
          { id: '2', type: 'output', data: { label: 'End' }, position: { x: 250, y: 120 } }
        ],
        edges: [
          { id: 'e1-2', source: '1', target: '2', animated: false, label: '' }
        ]
      };
    }
  }
}

module.exports = new CerebrasService();
