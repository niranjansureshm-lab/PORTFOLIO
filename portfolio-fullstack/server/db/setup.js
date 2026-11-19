/**
 * One-command database setup:
 *   npm run db:setup          -> creates DB (if missing), tables, roles, permissions, seed data, admin user
 *   npm run db:reset          -> DROPS all tables first, then does the above
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const bcrypt = require('bcryptjs');
const seed = require('./seedData');

const cfg = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
};
const DB_NAME = process.env.DB_NAME || 'portfolio_db';
const reset = process.argv.includes('--reset');

async function ensureDatabase() {
  const admin = new Client({ ...cfg, database: 'postgres' });
  await admin.connect();
  const { rowCount } = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [DB_NAME]);
  if (!rowCount) {
    if (!/^[a-zA-Z0-9_]+$/.test(DB_NAME)) throw new Error('DB_NAME may only contain letters, numbers and _');
    await admin.query(`CREATE DATABASE "${DB_NAME}"`);
    console.log(`✔ Created database "${DB_NAME}"`);
  } else {
    console.log(`✔ Database "${DB_NAME}" already exists`);
  }
  await admin.end();
}

async function main() {
  await ensureDatabase();
  const db = new Client({ ...cfg, database: DB_NAME });
  await db.connect();

  try {
    await db.query('BEGIN');

    if (reset) {
      await db.query(`DROP TABLE IF EXISTS messages, certifications, experiences, skills, projects,
                      users, role_permissions, permissions, roles CASCADE`);
      console.log('✔ Dropped existing tables');
    }

    await db.query(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));
    console.log('✔ Tables ready');

    // Roles & permissions
    for (const r of seed.roles) {
      await db.query(
        `INSERT INTO roles (name, description) VALUES ($1,$2)
         ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description`, [r.name, r.description]);
    }
    for (const p of seed.permissions) {
      await db.query('INSERT INTO permissions (name) VALUES ($1) ON CONFLICT (name) DO NOTHING', [p]);
    }
    for (const [role, perms] of Object.entries(seed.rolePermissions)) {
      for (const p of perms) {
        await db.query(
          `INSERT INTO role_permissions (role_id, permission_id)
           SELECT r.id, p.id FROM roles r, permissions p WHERE r.name = $1 AND p.name = $2
           ON CONFLICT DO NOTHING`, [role, p]);
      }
    }
    console.log('✔ Roles & permissions seeded (admin / editor / viewer)');

    // Admin user
    const email = (process.env.ADMIN_EMAIL || 'admin@portfolio.local').toLowerCase();
    const exists = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (!exists.rowCount) {
      const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin@12345', 12);
      await db.query(
        `INSERT INTO users (name, email, password_hash, role_id)
         VALUES ($1,$2,$3,(SELECT id FROM roles WHERE name='admin'))`,
        [process.env.ADMIN_NAME || 'Admin', email, hash]);
      console.log(`✔ Admin user created: ${email}`);
    } else {
      console.log(`✔ Admin user already exists: ${email}`);
    }

    // Content (only seeded when tables are empty so your edits are never overwritten)
    const empty = async (t) => (await db.query(`SELECT COUNT(*)::int AS n FROM ${t}`)).rows[0].n === 0;

    if (await empty('projects')) {
      let i = 0;
      for (const p of seed.projects) {
        await db.query(
          `INSERT INTO projects (slug,name,category,filter_tags,icon,description,tech,github_url,detail,sort_order)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
          [p.slug, p.name, p.category, p.filter_tags, p.icon, p.description, p.tech, p.github_url, JSON.stringify(p.detail), i++]);
      }
      console.log(`✔ Seeded ${seed.projects.length} projects`);
    }
    if (await empty('skills')) {
      let i = 0, n = 0;
      for (const [cat, icon, list] of seed.skillGroups) {
        for (const [name, description, level] of list) {
          await db.query(
            `INSERT INTO skills (category,category_icon,name,description,level,sort_order) VALUES ($1,$2,$3,$4,$5,$6)`,
            [cat, icon, name, description, level, i++]); n++;
        }
      }
      console.log(`✔ Seeded ${n} skills`);
    }
    if (await empty('experiences')) {
      let i = 0;
      for (const e of seed.experiences) {
        await db.query(
          `INSERT INTO experiences (role,company,duration,description,highlights,sort_order) VALUES ($1,$2,$3,$4,$5,$6)`,
          [e.role, e.company, e.duration, e.description, JSON.stringify(e.highlights), i++]);
      }
      console.log(`✔ Seeded ${seed.experiences.length} experience`);
    }
    if (await empty('certifications')) {
      let i = 0;
      for (const c of seed.certifications) {
        await db.query(
          `INSERT INTO certifications (name,provider,year,icon,sort_order) VALUES ($1,$2,$3,$4,$5)`,
          [c.name, c.provider, c.year, c.icon, i++]);
      }
      console.log(`✔ Seeded ${seed.certifications.length} certifications`);
    }

    await db.query('COMMIT');
    console.log('\n🎉 Database setup complete. Run: npm start');
  } catch (err) {
    await db.query('ROLLBACK');
    throw err;
  } finally {
    await db.end();
  }
}

main().catch((err) => {
  console.error('\n✖ Database setup failed:', err.message);
  if (err.code === 'ECONNREFUSED') console.error('  PostgreSQL is not running / wrong DB_HOST or DB_PORT in server/.env');
  if (err.code === '28P01') console.error('  Wrong DB_USER / DB_PASSWORD in server/.env');
  process.exit(1);
});
