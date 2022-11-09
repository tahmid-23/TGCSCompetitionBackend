import mysql, { Pool } from 'mysql2/promise';

export function createTGCSPool(
  host?: string,
  port?: number,
  password?: string
): Pool {
  return mysql.createPool({
    connectionLimit: 10,
    host: host,
    port: port,
    user: 'tgcs',
    password: password,
    database: 'tgcs_competition'
  });
}
