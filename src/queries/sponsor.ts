import { Connection, RowDataPacket } from 'mysql2/promise.js';
import { createCommaSeparatedColumns } from './utils/query-utils.js';

const sponsorFields = ['sponsor_id', 'name', 'address', 'email', 'phone'];
const sponsorColumnNames = createCommaSeparatedColumns(
  'sponsor',
  sponsorFields
);

export async function queryAllSponsors(
  connection: Connection
): Promise<Record<string, object>[]> {
  const [sponsorRows] = await connection.query<RowDataPacket[]>(
    `SELECT ${sponsorColumnNames} FROM sponsor`
  );

  const sponsors: Record<string, object>[] = [];
  for (const row of sponsorRows) {
    const sponsorId = row['sponsor_id'];
    const sponsorRecord: Record<string, object> = {
      sponsor_id: sponsorId
    };
    for (const field of sponsorFields) {
      sponsorRecord[field] = row[field];
    }

    sponsors.push(sponsorRecord);
  }

  return sponsors;
}
