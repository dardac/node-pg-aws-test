import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432', 10),
});

async function initializeDatabase(): Promise<void> {
  try {
    const client = await pool.connect();
    const initScript = fs.readFileSync(
      path.join(__dirname, '../init/01.sql'),
      'utf8'
    );
    await client.query(initScript);
    console.log('Database initialized successfully');
    client.release();
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

initializeDatabase();

export { pool };
