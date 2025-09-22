const jwt = require('jsonwebtoken');
const User = require('../models/Users');

module.exports = async function (req, res, next) {
  // Accept token from header, body, or query
  let token = req.headers['authorization'] || req.headers['Authorization'];
  if (token && token.startsWith('Bearer ')) {
    token = token.slice(7);
  }
  if (!token) {
    return res.status(401).json({ error: 'No token, authorization denied' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      return res.status(401).json({ error: 'User not found, authorization denied' });
    }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token is not valid' });
  }
};
