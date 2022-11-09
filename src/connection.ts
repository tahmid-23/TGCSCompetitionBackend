import mysql, { Connection } from 'mysql2/promise';

export function createTGCSConnection(
  host?: string,
  port?: number,
  password?: string
): Promise<Connection> {
  return mysql.createConnection({
    host: host,
    port: port,
    user: 'tgcs',
    password: password,
    database: 'tgcs_competition'
  });
}
