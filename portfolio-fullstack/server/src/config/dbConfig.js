/**
 * One place that decides how to connect to PostgreSQL.
 *  - Local:  DB_HOST / DB_PORT / DB_USER / DB_PASSWORD / DB_NAME
 *  - Hosted: DATABASE_URL (Neon, Render, Railway, Supabase...) -> SSL is switched on automatically
 */
function getConfig() {
  const url = process.env.DATABASE_URL;
  if (url) {
    const u = new URL(url);
    const local = ['localhost', '127.0.0.1', '::1'].includes(u.hostname);
    const wantSsl = process.env.DB_SSL ? process.env.DB_SSL === 'true' : !local;
    return {
      host: u.hostname,
      port: Number(u.port || 5432),
      user: decodeURIComponent(u.username),
      password: decodeURIComponent(u.password),
      database: u.pathname.replace(/^\//, ''),
      ssl: wantSsl ? { rejectUnauthorized: false } : false,
      hosted: true,
    };
  }
  return {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'portfolio_db',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    hosted: false,
  };
}
module.exports = { getConfig };
