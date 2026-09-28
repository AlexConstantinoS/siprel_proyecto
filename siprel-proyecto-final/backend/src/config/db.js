const mysql = require('mysql2/promise');

const password = process.env.DB_PASSWORD || '';
if (!password) throw new Error('DB_PASSWORD es obligatorio. Revisa el archivo .env/docker-compose.');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'db',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'siprel_app',
  password,
  database: process.env.DB_NAME || 'siprel_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 100,
  connectTimeout: 10000,
  multipleStatements: false
});

module.exports = pool;
