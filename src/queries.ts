import mysql from 'mysql2';

export function createTGCSConnection(
  host?: string,
  port?: number,
  password?: string
) {
  return mysql.createConnection({
    host: host,
    port: port,
    user: 'tgcs',
    password: password,
    database: 'tgcs_competition'
  });
}
