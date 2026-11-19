const jwt = require('jsonwebtoken');
const pool = require('../config/db');

/** Reads "Authorization: Bearer <token>", loads the user + role + permissions from the DB. */
async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Authentication required' });

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const { rows } = await pool.query(
      `SELECT u.id, u.name, u.email, u.is_active, r.name AS role,
              COALESCE(array_agg(p.name) FILTER (WHERE p.name IS NOT NULL), '{}') AS permissions
       FROM users u
       JOIN roles r ON r.id = u.role_id
       LEFT JOIN role_permissions rp ON rp.role_id = r.id
       LEFT JOIN permissions p ON p.id = rp.permission_id
       WHERE u.id = $1
       GROUP BY u.id, r.name`,
      [payload.sub]
    );
    const user = rows[0];
    if (!user || !user.is_active) return res.status(401).json({ error: 'Account not found or disabled' });

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

/** RBAC guard: user must have ALL listed permissions. */
const authorize = (...needed) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Authentication required' });
  const ok = needed.every((p) => req.user.permissions.includes(p));
  if (!ok) return res.status(403).json({ error: 'You do not have permission to do this', required: needed });
  next();
};

module.exports = { authenticate, authorize };
