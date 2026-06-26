require('dotenv').config();
const mysql = require('mysql2/promise');

const DB_NAME = process.env.DB_NAME || 'taskapi_db';

async function initDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  const [rows] = await connection.execute(
    `SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?`,
    [DB_NAME]
  );

  if (rows.length === 0) {
    await connection.execute(`CREATE DATABASE \`${DB_NAME}\``);
    console.log(`Database '${DB_NAME}' created successfully.`);
  } else {
    console.log(`Database '${DB_NAME}' already exists.`);
  }

  await connection.end();
}

initDatabase().catch((err) => {
  console.error('Failed to initialize database:', err.message);
  process.exit(1);
});
