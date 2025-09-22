(async () => {
  // Load backend .env manually
  const fs = require('fs');
  const envRaw = fs.readFileSync('./backend/.env', 'utf8');
  envRaw.split(/\r?\n/).forEach(line => {
    line = line.trim();
    if (!line || line.startsWith('#') || line.startsWith('/')) return;
    const idx = line.indexOf('=');
    if (idx === -1) return;
    const key = line.substring(0, idx).trim();
    const val = line.substring(idx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  });

  const CerebrasService = require('../backend/services/CerebrasService');
  try {
    const q = await CerebrasService.generateInterviewQuestions('Backend Engineer','Build APIs and databases','4',3);
    console.log('Questions result:', JSON.stringify(q, null, 2));
  } catch (e) {
    console.error('Error calling CerebrasService:', e);
  }
})();
