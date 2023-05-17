import { Connection, RowDataPacket } from 'mysql2/promise.js';

interface Login {
  hash: string;
  expiration: number | undefined;
  admin: boolean;
}

export async function queryLogin(
  connection: Connection,
  username: string
): Promise<Login | undefined> {
  const [rows] = await connection.query<RowDataPacket[]>(
    'SELECT hash, expiration, admin FROM login WHERE username = ?',
    [username]
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
  username: string,
  expiration: number
): Promise<void> {
  await connection.execute(
    'UPDATE login SET expiration = ? WHERE username = ?',
    [username, expiration]
  );
}

export async function removeLogin(
  connection: Connection,
  username: string
): Promise<void> {
  await connection.execute('DELETE FROM login WHERE username = ?', [username]);
}

export async function createLogin(
  connection: Connection,
  username: string,
  hash: string,
  admin: boolean
) {
  await connection.execute(
    'INSERT INTO login (username, hash, admin) VALUES (?, ?, ?)',
    [username, hash, admin]
  );
}
