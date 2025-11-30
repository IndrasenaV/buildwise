const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-insecure-secret';

function signToken(payload, options = {}) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '14d', ...options });
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

function getTokenFromHeader(req) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme?.toLowerCase() === 'bearer' && token) {
    return token;
  }
  return null;
}

function requireAuth(req, res, next) {
  try {
    const token = getTokenFromHeader(req);
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
}

function optionalAuth(req, _res, next) {
  try {
    const token = getTokenFromHeader(req);
    if (token) {
      const decoded = verifyToken(token);
      req.user = decoded;
    }
  } catch (_e) {
    // ignore
  }
  next();
}

module.exports = { signToken, verifyToken, requireAuth, optionalAuth };


