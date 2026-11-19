const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const pool = require('../config/db');
const asyncHandler = require('../middleware/asyncHandler');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts, please try again later.' },
});

const sign = (userId) =>
  jwt.sign({ sub: userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role, permissions: u.permissions });

// Self-registration always creates a "viewer" (lowest role). Admins can promote later.
router.post('/register', authLimiter, asyncHandler(async (req, res) => {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  if (name.length < 2) return res.status(400).json({ error: 'Name must be at least 2 characters' });
  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Enter a valid email' });
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

  const hash = await bcrypt.hash(password, 12);
  const { rows } = await pool.query(
    `INSERT INTO users (name,email,password_hash,role_id)
     VALUES ($1,$2,$3,(SELECT id FROM roles WHERE name='viewer')) RETURNING id`,
    [name, email, hash]
  );
  res.status(201).json({ message: 'Account created. You can log in now.', id: rows[0].id });
}));

router.post('/login', authLimiter, asyncHandler(async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

  const { rows } = await pool.query(
    `SELECT u.id, u.password_hash, u.is_active FROM users u WHERE u.email = $1`, [email]);
  const row = rows[0];
  const valid = row && (await bcrypt.compare(password, row.password_hash));
  if (!valid) return res.status(401).json({ error: 'Invalid email or password' });
  if (!row.is_active) return res.status(403).json({ error: 'This account is disabled' });

  res.json({ token: sign(row.id) });
}));

router.get('/me', authenticate, (req, res) => res.json({ user: publicUser(req.user) }));

router.put('/password', authenticate, asyncHandler(async (req, res) => {
  const current = String(req.body.currentPassword || '');
  const next = String(req.body.newPassword || '');
  if (next.length < 8) return res.status(400).json({ error: 'New password must be at least 8 characters' });
  const { rows } = await pool.query('SELECT password_hash FROM users WHERE id=$1', [req.user.id]);
  if (!(await bcrypt.compare(current, rows[0].password_hash)))
    return res.status(400).json({ error: 'Current password is incorrect' });
  await pool.query('UPDATE users SET password_hash=$1, updated_at=NOW() WHERE id=$2',
    [await bcrypt.hash(next, 12), req.user.id]);
  res.json({ message: 'Password updated' });
}));

module.exports = router;
