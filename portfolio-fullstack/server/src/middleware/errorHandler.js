function notFound(req, res) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err.code === '23505') return res.status(409).json({ error: 'That value already exists (duplicate).' });
  if (err.code === '23503') return res.status(409).json({ error: 'This record is still referenced by something else.' });
  if (err.code === '22P02' || err.code === '23514') return res.status(400).json({ error: 'Invalid data supplied.' });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON body' });
  console.error(err);
  res.status(err.status || 500).json({ error: err.status ? err.message : 'Internal server error' });
}

module.exports = { notFound, errorHandler };
