require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) {
  console.error('✖ JWT_SECRET is missing or too short. Set it in server/.env');
  process.exit(1);
}

const app = require('./app');
const pool = require('./config/db');
const port = Number(process.env.PORT || 5000);

pool.query('SELECT 1')
  .then(() => {
    app.listen(port, () => {
      console.log(`✔ Database connected`);
      console.log(`✔ Portfolio : http://localhost:${port}`);
      console.log(`✔ Admin     : http://localhost:${port}/admin`);
    });
  })
  .catch((err) => {
    console.error('✖ Cannot connect to PostgreSQL:', err.message);
    console.error('  Check server/.env and run:  npm run db:setup');
    process.exit(1);
  });
