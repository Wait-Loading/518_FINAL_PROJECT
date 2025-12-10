const jwt = require('jsonwebtoken');
const User = require('../models/User');

async function auth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'Missing token' });

    // Verify token
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // Use payload.userId instead of payload.id
    const user = await User.findById(payload.userId);
    if (!user) return res.status(401).json({ message: 'Invalid token' });

    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      location: user.location,
    };

    next();
  } catch (err) {
    console.error('AUTH MIDDLEWARE ERROR:', err.message);
    return res.status(401).json({ message: 'Unauthorized' });
  }
}

module.exports = auth;
