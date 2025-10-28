import axios from 'axios';

/**
 * Server-side proxy that forwards compile/run requests to OneCompiler RapidAPI
 * Expects environment variables RAPIDAPI_KEY and optionally RAPIDAPI_HOST.
 *
 * Note: OneCompiler's /api/v1/run typically accepts { language, code, stdin }
 * We'll forward the first test case input (if provided) as stdin.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { language, code, testCases, input } = req.body || {};

  // Require API key to be set in environment for deployed server
  const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || process.env.NEXT_PUBLIC_RAPIDAPI_KEY;
  const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST || 'onecompiler-apis.p.rapidapi.com';

  if (!RAPIDAPI_KEY) {
    return res.status(500).json({ message: 'RAPIDAPI_KEY not configured on server' });
  }

  // Choose stdin: prefer explicit input, otherwise first test case input if available
  let stdin = '';
  if (typeof input === 'string' && input.length > 0) stdin = input;
  else if (Array.isArray(testCases) && testCases.length > 0) stdin = testCases[0].input || '';

  const payload = {
    language: language || 'cpp',
    code: code || '',
    stdin: stdin
  };

  try {
    const response = await axios.post('https://onecompiler-apis.p.rapidapi.com/api/v1/run', payload, {
      headers: {
        'Content-Type': 'application/json',
        'X-RapidAPI-Host': RAPIDAPI_HOST,
        'X-RapidAPI-Key': RAPIDAPI_KEY
      },
      timeout: 20000
    });

    // Forward the OneCompiler response as-is to the client
    return res.status(200).json(response.data);
  } catch (error) {
    console.error('OneCompiler proxy error:', error.response?.data || error.message);
    const errMsg = error.response?.data || error.message || 'Unknown error from OneCompiler';
    return res.status(502).json({ message: 'Error from OneCompiler', error: errMsg });
  }
}