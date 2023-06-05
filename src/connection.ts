import mysql, { Pool } from 'mysql2/promise.js';
import { SqlConfig } from './config.js';

export function createTGCSPool(config: SqlConfig): Pool {
  return mysql.createPool({
    connectionLimit: 10,
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: 'tgcs_competition'
  });
}
