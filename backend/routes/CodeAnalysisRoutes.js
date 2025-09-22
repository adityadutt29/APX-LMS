const express = require('express');
const router = express.Router();
const CerebrasService = require('../services/CerebrasService');

// Generate flowchart from code
router.post('/generate-flowchart', async (req, res) => {
  try {
    const { code, language } = req.body;

    if (!code || !language) {
      return res.status(400).json({ 
        error: 'Code and language are required' 
      });
    }

  const flowchartData = await CerebrasService.generateFlowchartData(code, language);
    
    res.json({
      success: true,
      flowchartData
    });
  } catch (error) {
    console.error('Flowchart generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate flowchart',
      details: error.message 
    });
  }
});

// Analyze time complexity
router.post('/analyze-complexity', async (req, res) => {
  try {
    const { code, language } = req.body;

    if (!code || !language) {
      return res.status(400).json({ 
        error: 'Code and language are required' 
      });
    }

    const prompt = `
      Analyze the time and space complexity of this ${language} code.
      Return JSON with:
      - timeComplexity: Big O notation (e.g., "O(n)", "O(log n)")
      - spaceComplexity: Space complexity notation
      - confidence: percentage (0-100)
      - explanation: brief explanation of the complexity
      - suggestions: array of optimization suggestions
      
      Code:
      \`\`\`${language}
      ${code}
      \`\`\`
    `;

  // Use the existing Cerebras service
    // Use CerebrasService structured output
    const dataText = await CerebrasService.chat(prompt, { temperature: 0.3, max_completion_tokens: 1024 });
    const cleanedResponse = dataText.replace('```json', '').replace('```', '').trim();
    const complexityData = JSON.parse(cleanedResponse);
    
    res.json({
      success: true,
      complexityData
    });
  } catch (error) {
    console.error('Complexity analysis error:', error);
    res.status(500).json({ 
      error: 'Failed to analyze complexity',
      details: error.message 
    });
  }
});

module.exports = router;
