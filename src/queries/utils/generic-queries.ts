import { Connection, RowDataPacket } from 'mysql2/promise';

export async function genericQuery(
  connection: Connection,
  queryString: string,
  tableId: string,
  fields: string[]
): Promise<Record<number, Record<string, object>>> {
  const [rows] = await connection.query<RowDataPacket[]>(queryString);

  const records: Record<number, Record<string, object>> = {};
  for (const row of rows) {
    const record: Record<string, object> = {};
    for (const field of fields) {
      if (field !== tableId) {
        record[field] = row[field];
      }
    }

    records[row[tableId]] = record;
  }

  return records;
}

export async function genericMultiQuery(
  connection: Connection,
  queryString: string,
  tableId: string,
  fields: string[]
): Promise<Record<number, Record<string, object>[]>> {
  const [rows] = await connection.query<RowDataPacket[]>(queryString);

  const records: Record<number, Record<string, object>[]> = {};
  for (const row of rows) {
    const record: Record<string, object> = {};
    for (const field of fields) {
      if (field !== tableId) {
        record[field] = row[field];
      }
    }

    const existingRecords = records[row[tableId]];
    if (existingRecords) {
      existingRecords.push(record);
    } else {
      records[row[tableId]] = [record];
    }
  }

  return records;
}
