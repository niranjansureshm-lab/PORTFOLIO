const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const pool = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const content = require('./routes/content');

const app = express();

// The portfolio uses CDN scripts (Tailwind, React, Babel) + inline JSX, so CSP is relaxed for pages
// but all other helmet protections stay on.
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', async (req, res) => {
  try { await pool.query('SELECT 1'); res.json({ status: 'ok', db: 'connected' }); }
  catch { res.status(503).json({ status: 'error', db: 'disconnected' }); }
});

app.use('/api', require('./routes/public'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/admin/projects', content.projects);
app.use('/api/admin/skills', content.skills);
app.use('/api/admin/experiences', content.experiences);
app.use('/api/admin/certifications', content.certifications);

app.use('/api', notFound);

// Frontend (portfolio at "/", admin panel at "/admin")
const publicDir = path.join(__dirname, '..', '..', 'client', 'public');
app.use(express.static(publicDir));
app.get('/admin', (req, res) => res.sendFile(path.join(publicDir, 'admin.html')));

app.use(errorHandler);
module.exports = app;
