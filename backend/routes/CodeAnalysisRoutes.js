const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// @desc    Generate flowchart from code
// @route   POST /api/code-analysis/generate-flowchart
// @access  Private
router.post('/generate-flowchart', auth, async (req, res) => {
  try {
    const { code, language } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'Code is required' });
    }

    // Simple flowchart generation logic
    const flowchartData = generateFlowchartFromCode(code, language);
    
    res.json({ flowchartData });
  } catch (error) {
    console.error('Flowchart generation error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate flowchart' });
  }
});

// Helper function to generate flowchart structure
function generateFlowchartFromCode(code, language) {
  const nodes = [];
  const edges = [];
  
  // Start node
  nodes.push({ 
    id: 'start', 
    type: 'start', 
    content: 'Start', 
    position: { x: 400, y: 0 } 
  });
  
  let nodeId = 1;
  const lines = code.split('\n').filter(l => l.trim());
  let yPosition = 100;
  let lastNodeId = 'start';
  let decisionStack = []; // Track nested decisions
  
  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    const indent = line.search(/\S/);
    let nodeType = 'process';
    let content = trimmed;
    
    // Skip empty lines and closing braces
    if (!trimmed || trimmed === '}' || trimmed === '{') return;
    
    // Detect node types
    if (trimmed.match(/^(if|while|for|switch)\s*\(/i)) {
      nodeType = 'decision';
      content = trimmed.replace(/[{};]/g, '').replace(/\s+/g, ' ').trim();
      if (content.length > 40) content = content.substring(0, 37) + '...';
    } else if (trimmed.match(/^else\s+if/i)) {
      nodeType = 'decision';
      content = trimmed.replace(/[{};]/g, '').trim();
    } else if (trimmed.match(/(cin|scanf|input|read|gets|getline)\s*[>|<|(]/i)) {
      nodeType = 'input';
      content = 'Read ' + trimmed.replace(/[{};]/g, '').substring(0, 25);
    } else if (trimmed.match(/(cout|printf|print|write|puts)\s*[<|(]/i)) {
      nodeType = 'output';
      const match = trimmed.match(/["'](.+?)["']/) || trimmed.match(/<<\s*(.+?)\s*[;<]/);
      content = 'Output: ' + (match ? match[1].substring(0, 20) : 'result');
    } else if (trimmed.match(/^(return|exit|break)/i)) {
      // Skip or handle specially
      return;
    } else {
      // Variable declaration or assignment
      content = trimmed.replace(/[{};]/g, '').substring(0, 35);
    }
    
    const currentId = `node${nodeId}`;
    const xPosition = 400 + (decisionStack.length * 150 * (nodeId % 2 === 0 ? 1 : -1));
    
    nodes.push({
      id: currentId,
      type: nodeType,
      content: content,
      position: { x: xPosition, y: yPosition }
    });
    
    // Create edge from last node
    edges.push({
      id: `e${nodeId}`,
      source: lastNodeId,
      target: currentId,
      label: nodeType === 'decision' && decisionStack.length > 0 ? 'True' : ''
    });
    
    if (nodeType === 'decision') {
      decisionStack.push(currentId);
    }
    
    lastNodeId = currentId;
    nodeId++;
    yPosition += 150;
  });
  
  // Add end node
  nodes.push({
    id: 'end',
    type: 'end',
    content: 'Stop',
    position: { x: 400, y: yPosition }
  });
  
  edges.push({
    id: `e-end`,
    source: lastNodeId,
    target: 'end'
  });
  
  return { nodes, edges };
}

module.exports = router;
