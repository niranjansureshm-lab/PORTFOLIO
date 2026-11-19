const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const asyncHandler = require('../middleware/asyncHandler');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ---------- Dashboard ----------
router.get('/stats', authorize('dashboard:read'), asyncHandler(async (req, res) => {
  const q = (sql) => pool.query(sql).then((r) => r.rows[0].n);
  const [projects, skills, experiences, certifications, messages, unread, users] = await Promise.all([
    q('SELECT COUNT(*)::int n FROM projects'),
    q('SELECT COUNT(*)::int n FROM skills'),
    q('SELECT COUNT(*)::int n FROM experiences'),
    q('SELECT COUNT(*)::int n FROM certifications'),
    q('SELECT COUNT(*)::int n FROM messages'),
    q('SELECT COUNT(*)::int n FROM messages WHERE NOT is_read'),
    q('SELECT COUNT(*)::int n FROM users'),
  ]);
  res.json({ projects, skills, experiences, certifications, messages, unread, users });
}));

// ---------- Messages ----------
router.get('/messages', authorize('messages:read'), asyncHandler(async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM messages ORDER BY created_at DESC');
  res.json(rows);
}));

router.patch('/messages/:id(\\d+)/read', authorize('messages:manage'), asyncHandler(async (req, res) => {
  const is_read = req.body.is_read !== false;
  const { rows } = await pool.query('UPDATE messages SET is_read=$1 WHERE id=$2 RETURNING *', [is_read, req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
}));

router.delete('/messages/:id(\\d+)', authorize('messages:manage'), asyncHandler(async (req, res) => {
  const { rowCount } = await pool.query('DELETE FROM messages WHERE id=$1', [req.params.id]);
  if (!rowCount) return res.status(404).json({ error: 'Not found' });
  res.json({ message: 'Deleted' });
}));

// ---------- Users & roles (admin only) ----------
router.get('/roles', authorize('users:read'), asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT r.id, r.name, r.description,
            COALESCE(array_agg(p.name ORDER BY p.name) FILTER (WHERE p.name IS NOT NULL), '{}') AS permissions
     FROM roles r
     LEFT JOIN role_permissions rp ON rp.role_id=r.id
     LEFT JOIN permissions p ON p.id=rp.permission_id
     GROUP BY r.id ORDER BY r.id`);
  res.json(rows);
}));

router.get('/users', authorize('users:read'), asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT u.id, u.name, u.email, u.is_active, u.created_at, r.name AS role
     FROM users u JOIN roles r ON r.id=u.role_id ORDER BY u.id`);
  res.json(rows);
}));

router.post('/users', authorize('users:manage'), asyncHandler(async (req, res) => {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const role = String(req.body.role || 'viewer');
  if (name.length < 2) return res.status(400).json({ error: 'Name must be at least 2 characters' });
  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Enter a valid email' });
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
  const r = await pool.query('SELECT id FROM roles WHERE name=$1', [role]);
  if (!r.rowCount) return res.status(400).json({ error: 'Unknown role' });
  const { rows } = await pool.query(
    `INSERT INTO users (name,email,password_hash,role_id) VALUES ($1,$2,$3,$4)
     RETURNING id,name,email,is_active`,
    [name, email, await bcrypt.hash(password, 12), r.rows[0].id]);
  res.status(201).json({ ...rows[0], role });
}));

async function adminCount(excludingId) {
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int n FROM users u JOIN roles r ON r.id=u.role_id
     WHERE r.name='admin' AND u.is_active AND u.id <> $1`, [excludingId]);
  return rows[0].n;
}

router.put('/users/:id(\\d+)', authorize('users:manage'), asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const cur = await pool.query('SELECT u.id, r.name AS role FROM users u JOIN roles r ON r.id=u.role_id WHERE u.id=$1', [id]);
  if (!cur.rowCount) return res.status(404).json({ error: 'Not found' });

  const sets = []; const vals = [];
  const push = (col, v) => { vals.push(v); sets.push(`${col}=$${vals.length}`); };

  if (req.body.name !== undefined) {
    const n = String(req.body.name).trim();
    if (n.length < 2) return res.status(400).json({ error: 'Name must be at least 2 characters' });
    push('name', n);
  }
  const demoting = (req.body.role !== undefined && req.body.role !== 'admin') ||
                   (req.body.is_active === false);
  if (cur.rows[0].role === 'admin' && demoting && (await adminCount(id)) === 0)
    return res.status(400).json({ error: 'You cannot remove or disable the last active admin' });

  if (req.body.role !== undefined) {
    const r = await pool.query('SELECT id FROM roles WHERE name=$1', [req.body.role]);
    if (!r.rowCount) return res.status(400).json({ error: 'Unknown role' });
    push('role_id', r.rows[0].id);
  }
  if (req.body.is_active !== undefined) push('is_active', !!req.body.is_active);
  if (req.body.password) {
    if (String(req.body.password).length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
    push('password_hash', await bcrypt.hash(String(req.body.password), 12));
  }
  if (!sets.length) return res.status(400).json({ error: 'Nothing to update' });

  vals.push(id);
  await pool.query(`UPDATE users SET ${sets.join(',')}, updated_at=NOW() WHERE id=$${vals.length}`, vals);
  res.json({ message: 'User updated' });
}));

router.delete('/users/:id(\\d+)', authorize('users:manage'), asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (id === req.user.id) return res.status(400).json({ error: 'You cannot delete your own account' });
  const cur = await pool.query('SELECT r.name AS role FROM users u JOIN roles r ON r.id=u.role_id WHERE u.id=$1', [id]);
  if (!cur.rowCount) return res.status(404).json({ error: 'Not found' });
  if (cur.rows[0].role === 'admin' && (await adminCount(id)) === 0)
    return res.status(400).json({ error: 'You cannot delete the last admin' });
  await pool.query('DELETE FROM users WHERE id=$1', [id]);
  res.json({ message: 'User deleted' });
}));

module.exports = router;
