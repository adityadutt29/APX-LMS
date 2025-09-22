// pages/api/verify.js
import axios from 'axios';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { language, code, testCases } = req.body;

    try {
      const response = await axios.post('https://compiler-backend-woad.vercel.app/api/verify', {
        language,
        code,
        testCases
      }, {
        headers: { 'Content-Type': 'application/json' }
      });

      res.status(200).json(response.data);
    } catch (error) {
      res.status(500).json({ message: 'Error verifying code', error: error.message });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(Method `${req.method} Not Allowed);`);
  }
}