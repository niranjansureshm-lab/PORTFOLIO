const express = require('express');
const pool = require('../config/db');
const asyncHandler = require('../middleware/asyncHandler');
const { authenticate, authorize } = require('../middleware/auth');

/**
 * Builds a protected CRUD router for a table.
 * fields: { column: { type: 'string'|'int'|'bool'|'array'|'json', required?: bool, max?: number } }
 * Only whitelisted columns can ever be written (prevents SQL injection / mass assignment).
 */
function coerce(def, value) {
  switch (def.type) {
    case 'int': { const n = Number(value); if (!Number.isFinite(n)) throw new Error('must be a number'); return Math.trunc(n); }
    case 'bool': return value === true || value === 'true' || value === 1;
    case 'array': {
      if (typeof value === 'string') value = value.split(',');
      if (!Array.isArray(value)) throw new Error('must be a list');
      return value.map((v) => String(v).trim()).filter(Boolean);
    }
    case 'json': {
      const v = typeof value === 'string' ? JSON.parse(value) : value;
      return JSON.stringify(v);
    }
    default: {
      const s = String(value ?? '').trim();
      if (def.max && s.length > def.max) throw new Error(`must be at most ${def.max} characters`);
      return s;
    }
  }
}

function crudRouter({ table, resource, fields, orderBy = 'sort_order ASC, id ASC' }) {
  const router = express.Router();
  const cols = Object.keys(fields);

  function buildValues(body, partial) {
    const out = {};
    for (const col of cols) {
      const def = fields[col];
      const present = body[col] !== undefined;
      if (!present) {
        if (!partial && def.required) throw Object.assign(new Error(`${col} is required`), { status: 400 });
        continue;
      }
      try {
        const v = coerce(def, body[col]);
        if (def.required && def.type === 'string' && v === '') throw new Error('is required');
        out[col] = v;
      } catch (e) {
        throw Object.assign(new Error(`${col} ${e.message}`), { status: 400 });
      }
    }
    return out;
  }

  router.use(authenticate);

  router.get('/', authorize(`${resource}:read`), asyncHandler(async (req, res) => {
    const { rows } = await pool.query(`SELECT * FROM ${table} ORDER BY ${orderBy}`);
    res.json(rows);
  }));

  router.get('/:id(\\d+)', authorize(`${resource}:read`), asyncHandler(async (req, res) => {
    const { rows } = await pool.query(`SELECT * FROM ${table} WHERE id=$1`, [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  }));

  router.post('/', authorize(`${resource}:write`), asyncHandler(async (req, res) => {
    const values = buildValues(req.body, false);
    const keys = Object.keys(values);
    if (!keys.length) return res.status(400).json({ error: 'No data supplied' });
    const params = keys.map((_, i) => `$${i + 1}`);
    const { rows } = await pool.query(
      `INSERT INTO ${table} (${keys.join(',')}) VALUES (${params.join(',')}) RETURNING *`,
      keys.map((k) => values[k]));
    res.status(201).json(rows[0]);
  }));

  router.put('/:id(\\d+)', authorize(`${resource}:write`), asyncHandler(async (req, res) => {
    const values = buildValues(req.body, true);
    const keys = Object.keys(values);
    if (!keys.length) return res.status(400).json({ error: 'No data supplied' });
    const sets = keys.map((k, i) => `${k}=$${i + 1}`);
    const { rows } = await pool.query(
      `UPDATE ${table} SET ${sets.join(',')}, updated_at=NOW() WHERE id=$${keys.length + 1} RETURNING *`,
      [...keys.map((k) => values[k]), req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  }));

  router.delete('/:id(\\d+)', authorize(`${resource}:write`), asyncHandler(async (req, res) => {
    const { rowCount } = await pool.query(`DELETE FROM ${table} WHERE id=$1`, [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  }));

  return router;
}

module.exports = crudRouter;
