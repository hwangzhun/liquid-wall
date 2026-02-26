const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未登录，请先登录' });
  }

  const token = authHeader.slice(7);
  const jwtSecret = process.env.JWT_SECRET || 'liquid-wall-secret-key';

  try {
    const payload = jwt.verify(token, jwtSecret);
    req.admin = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Token 无效或已过期，请重新登录' });
  }
}

module.exports = { requireAuth };
