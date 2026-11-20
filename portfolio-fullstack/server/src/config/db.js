const { Pool } = require('pg');
const { getConfig } = require('./dbConfig');

const { hosted, ...cfg } = getConfig();
const pool = new Pool({ ...cfg, max: 10 });

pool.on('error', (err) => console.error('Unexpected PG pool error:', err.message));

module.exports = pool;
