const express = require('express');
const jwt = require('jsonwebtoken');
const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const router = express.Router();

// ── 内存中的失败计数器 ──────────────────────────────────────────
// 结构: { [ip]: { count: number, lockedUntil: number|null } }
const failStore = {};

const MAX_ATTEMPTS = 5;          // 允许的最大连续失败次数
const LOCK_DURATION_MS = 15 * 60 * 1000; // 锁定时长：15 分钟
const WINDOW_MS = 15 * 60 * 1000;        // 滑动窗口：15 分钟

// ── IP 级速率限制（express-rate-limit）──────────────────────────
// 15 分钟内最多尝试 20 次（覆盖正常输错场景）
const loginRateLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: '请求过于频繁，请 15 分钟后再试' },
  keyGenerator: (req) => ipKeyGenerator(req),
});

// ── 工具函数 ──────────────────────────────────────────────────
function getClientIp(req) {
  return (
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}

function isLocked(ip) {
  const rec = failStore[ip];
  if (!rec) return false;
  if (rec.lockedUntil && Date.now() < rec.lockedUntil) return true;
  // 锁定已过期，重置
  if (rec.lockedUntil && Date.now() >= rec.lockedUntil) {
    delete failStore[ip];
  }
  return false;
}

function recordFailure(ip) {
  if (!failStore[ip]) failStore[ip] = { count: 0, lockedUntil: null };
  failStore[ip].count += 1;
  if (failStore[ip].count >= MAX_ATTEMPTS) {
    failStore[ip].lockedUntil = Date.now() + LOCK_DURATION_MS;
  }
}

function resetFailure(ip) {
  delete failStore[ip];
}

function remainingLockSeconds(ip) {
  const rec = failStore[ip];
  if (!rec || !rec.lockedUntil) return 0;
  return Math.ceil((rec.lockedUntil - Date.now()) / 1000);
}

// ── POST /api/auth/login ──────────────────────────────────────
router.post('/login', loginRateLimiter, (req, res) => {
  const ip = getClientIp(req);

  // 1. 检查 IP 是否被锁定
  if (isLocked(ip)) {
    const secs = remainingLockSeconds(ip);
    const mins = Math.ceil(secs / 60);
    return res.status(429).json({
      error: `密码错误次数过多，账号已锁定，请 ${mins} 分钟后再试`,
    });
  }

  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: '请输入密码' });
  }

  const adminPassword = process.env.ADMIN_PASSWORD || 'changeme';
  const jwtSecret = process.env.JWT_SECRET || 'liquid-wall-secret-key';

  if (password !== adminPassword) {
    recordFailure(ip);

    const rec = failStore[ip];
    const remaining = MAX_ATTEMPTS - rec.count;

    if (rec.lockedUntil) {
      const mins = Math.ceil(remainingLockSeconds(ip) / 60);
      return res.status(401).json({
        error: `密码错误次数过多，账号已锁定，请 ${mins} 分钟后再试`,
      });
    }

    return res.status(401).json({
      error: `密码错误，还可尝试 ${remaining} 次`,
    });
  }

  // 登录成功 → 清除失败记录
  resetFailure(ip);

  const token = jwt.sign({ role: 'admin' }, jwtSecret, { expiresIn: '7d' });
  res.json({ token });
});

module.exports = router;
