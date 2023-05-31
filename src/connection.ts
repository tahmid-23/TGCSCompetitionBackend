import mysql, { Pool } from 'mysql2/promise.js';

export function createTGCSPool(
  host?: string,
  port?: number,
  password?: string
): Pool {
  return mysql.createPool({
    connectionLimit: 10,
    host: host,
    port: port,
    user: 'gifted_child',
    password: password,
    database: 'tgcs_competition'
  });
}
