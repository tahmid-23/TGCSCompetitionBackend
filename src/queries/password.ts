import { Connection, RowDataPacket } from 'mysql2/promise.js';

interface Login {
  hash: string;
  expiration: number | undefined;
  admin: boolean;
}

export async function queryLogin(
  connection: Connection,
  email: string
): Promise<Login | undefined> {
  const [rows] = await connection.query<RowDataPacket[]>(
    'SELECT hash, expiration, admin FROM login WHERE email = ?',
    [email]
  );

  if (rows.length === 0) {
    return undefined;
  }

  return {
    hash: rows[0].hash,
    expiration: rows[0].expiration,
    admin: rows[0].admin
  };
}

export async function updateExpirationTime(
  connection: Connection,
  email: string,
  expiration: number
): Promise<void> {
  await connection.execute(
    'UPDATE login SET expiration = ? WHERE email = ?',
    [email, expiration]
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
