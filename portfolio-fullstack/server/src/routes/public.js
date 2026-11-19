const express = require('express');
const rateLimit = require('express-rate-limit');
const pool = require('../config/db');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Everything the portfolio site needs, in the exact shape the React code expects. */
router.get('/portfolio', asyncHandler(async (req, res) => {
  const [projects, skills, experiences, certs] = await Promise.all([
    pool.query('SELECT * FROM projects WHERE published ORDER BY sort_order, id'),
    pool.query('SELECT * FROM skills WHERE published ORDER BY sort_order, id'),
    pool.query('SELECT * FROM experiences WHERE published ORDER BY sort_order, id'),
    pool.query('SELECT * FROM certifications WHERE published ORDER BY sort_order, id'),
  ]);

  const catMap = new Map();
  for (const s of skills.rows) {
    if (!catMap.has(s.category)) catMap.set(s.category, { name: s.category, icon: s.category_icon, skills: [] });
    catMap.get(s.category).skills.push({ name: s.name, description: s.description, level: s.level });
  }

  res.json({
    projects: projects.rows.map((p) => ({
      id: p.slug, name: p.name, category: p.category, filterTags: p.filter_tags, icon: p.icon,
      description: p.description, tech: p.tech,
      links: { github: p.github_url || undefined, live: p.live_url || undefined },
      detail: p.detail,
    })),
    skillCategories: [...catMap.values()],
    experiences: experiences.rows.map((e) => ({
      role: e.role, company: e.company, duration: e.duration, description: e.description, highlights: e.highlights,
    })),
    certifications: certs.rows.map((c) => ({ name: c.name, provider: c.provider, year: c.year, icon: c.icon })),
  });
}));

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false,
  message: { error: 'Too many messages. Please try again later.' },
});

router.post('/contact', contactLimiter, asyncHandler(async (req, res) => {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim();
  const message = String(req.body.message || '').trim();
  if (!name || name.length > 100) return res.status(400).json({ error: 'Please enter your name.' });
  if (!EMAIL_RE.test(email) || email.length > 160) return res.status(400).json({ error: 'Please enter a valid email.' });
  if (message.length < 10 || message.length > 5000) return res.status(400).json({ error: 'Message must be 10–5000 characters.' });
  await pool.query('INSERT INTO messages (name,email,message) VALUES ($1,$2,$3)', [name, email, message]);
  res.status(201).json({ message: 'Message received. Thank you!' });
}));

module.exports = router;
