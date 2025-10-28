const express = require('express');
const { runCode } = require('../controllers/CompilerController');
// Authentication intentionally omitted for this endpoint to allow in-browser
// compilation during development. In production you should re-enable auth
// and apply rate-limiting / quotas to prevent abuse.

const router = express.Router();

// Allow anyone to run code via backend proxy. Remove or change this in prod.
router.post('/run', runCode);

module.exports = router;
