(async () => {
  // Load backend .env manually to avoid installing dotenv here
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

  process.env.INTERVIEW_QUESTION_COUNT = process.env.INTERVIEW_QUESTION_COUNT || '3';

  const InterviewController = require('../backend/controllers/InterviewController');

  // Fake req/res objects
  const req = {
    body: {
      jobPosition: 'Frontend Engineer',
      jobDesc: 'Build React apps',
      jobExp: '3'
    },
    user: { email: 'test@example.com' }
  };

  const res = {
    status(code) { this._status = code; return this; },
    json(obj) { console.log('Response:', this._status || 200, obj); }
  };

  try {
    await InterviewController.generateInterview(req, res);
  } catch (err) {
    console.error('Controller threw:', err);
  }
})();
