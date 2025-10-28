const axios = require('axios');

// POST /api/compiler/run
// body: { language, code, stdin | input }
async function runCode(req, res) {
  try {
    // accept either `stdin` or `input` from clients
    const { language, code } = req.body || {};
    const stdin = req.body?.stdin ?? req.body?.input ?? '';

    const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
    const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST || 'onecompiler-apis.p.rapidapi.com';

    if (!RAPIDAPI_KEY) {
      return res.status(500).json({ message: 'RAPIDAPI_KEY not configured on server' });
    }

    // OneCompiler expects a files array: [{ name, content }]
    const extMap = {
      cpp: 'cpp',
      c: 'c',
      java: 'java',
      python: 'py',
      py: 'py',
      javascript: 'js',
      js: 'js'
    };

    const lang = (language || 'cpp').toLowerCase();
    const ext = extMap[lang] || 'txt';
    const defaultName = {
      cpp: 'main.cpp',
      c: 'main.c',
      java: 'Main.java',
      python: 'main.py',
      py: 'main.py',
      javascript: 'main.js',
      js: 'main.js'
    }[lang] || `file.${ext}`;

    // Normalize code content: some clients (PowerShell single-quoted strings) send literal "\\n" sequences
    // instead of real newlines. Convert common escaped sequences into actual characters so the compiler
    // receives valid source files.
    let content = code || '';
    if (typeof content === 'string' && content.includes('\\')) {
      // Replace CRLF and LF escape sequences first, then tabs.
      content = content.replace(/\\r\\n/g, '\r\n').replace(/\\n/g, '\n').replace(/\\t/g, '\t');
    }

    const payload = {
      language: lang,
      files: [
        {
          name: defaultName,
          content
        }
      ],
      stdin: String(stdin ?? '')
    };

    const response = await axios.post('https://onecompiler-apis.p.rapidapi.com/api/v1/run', payload, {
      headers: {
        'Content-Type': 'application/json',
        'X-RapidAPI-Host': RAPIDAPI_HOST,
        'X-RapidAPI-Key': RAPIDAPI_KEY
      },
      timeout: 30000
    });

    const d = response.data || {};

    // Build a structured result that frontend can use:
    // - results: array of runs (for now single run)
    // - each result contains actualOutput (stdout), stderr/compileError, exception, executionTime
    const results = [];

    const stdout = d.output ?? d.stdout ?? d.result ?? d.stdout_text ?? d.stdoutText ?? '';
    // Some backends provide stderr/compile output in different fields
    const stderr = d.stderr ?? d.stderr_text ?? d.compile_error ?? d.compileError ?? null;
    const exception = d.exception ?? d.error ?? d.message ?? null;
    const executionTime = d.executionTime ?? d.time ?? d.runtime ?? null;
    const exitCode = d.exitCode ?? d.exit_code ?? d.code ?? null;

    results.push({
      actualOutput: String(stdout ?? ''),
      stderr: stderr ? String(stderr) : null,
      exception: exception ? String(exception) : null,
      executionTime,
      exitCode
    });

    // If the upstream returned an exception or compile error, surface it with the raw response
    if (exception || stderr) {
      return res.json({ results, error: exception || stderr, raw: d });
    }

    return res.json({ results, raw: d });
  } catch (error) {
    // Try to include the upstream response body when available for easier debugging
    const upstream = error.response?.data ?? null;
    console.error('Compiler proxy error:', upstream || error.message);
    return res.status(502).json({ message: 'Error calling compiler service', error: upstream || error.message, raw: upstream });
  }
}

module.exports = { runCode };
