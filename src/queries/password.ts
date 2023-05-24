import { Connection, RowDataPacket } from 'mysql2/promise.js';

export interface Login {
  hash: string;
  expiration: number | undefined;
}

export async function queryHash(
  connection: Connection,
  email: string
): Promise<Login[]> {
  const [rows] = await connection.query<RowDataPacket[]>(
    'SELECT hash, expiration FROM login WHERE email = ?',
    [email]
  );

  return rows.map(row => {
    return {
      hash: row.hash,
      expiration: row.expiration
    }
  });
}

export async function updateExpirationTime(
  connection: Connection,
  email: string,
  expiration: number
): Promise<void> {
  await connection.execute(
    'UPDATE login SET expiration = ? WHERE email = ?',
    [expiration, email]
  );
}

export async function removeLogin(
  connection: Connection,
  email: string
): Promise<void> {
  await connection.execute('DELETE FROM login WHERE email = ?', [email]);
}

export async function createLogin(
  connection: Connection,
  email: string,
  hash: string,
) {
  await connection.execute(
    'INSERT INTO login (email, hash) VALUES (?, ?)',
    [email, hash]
  );
}

export async function isAdmin(connection: Connection, email: string): Promise<boolean> {
  const [rows] = await connection.execute<RowDataPacket[]>(
    'SELECT 1 FROM admin WHERE email = ?', [email]
  );
  
  return rows.length > 0;
}