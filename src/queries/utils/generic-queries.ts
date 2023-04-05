import { Connection, RowDataPacket } from 'mysql2/promise.js';

export async function genericQuery(
  connection: Connection,
  queryString: string,
  tableId: string,
  fields: string[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  values?: any | any[] | { [param: string]: any }
): Promise<Record<number, Record<string, object>>> {
  const [rows] = await connection.query<RowDataPacket[]>(queryString, values);

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

export async function genericQuerySingle(
  connection: Connection,
  queryString: string,
  tableId: string,
  tableIdValue: number,
  fields: string[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  values?: any | any[] | { [param: string]: any }
): Promise<Record<string, object>> {
  return (await genericQuery(connection, queryString, tableId, fields, values))[
    tableIdValue
  ];
}

export async function genericMultiQuery(
  connection: Connection,
  queryString: string,
  tableId: string,
  fields: string[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  values?: any | any[] | { [param: string]: any }
): Promise<Record<number, Record<string, object>[]>> {
  const [rows] = await connection.query<RowDataPacket[]>(queryString, values);

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

export async function genericMultiQuerySingle(
  connection: Connection,
  queryString: string,
  tableId: string,
  tableIdValue: number,
  fields: string[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  values?: any | any[] | { [param: string]: any }
): Promise<Record<string, object>[]> {
  return (
    await genericMultiQuery(connection, queryString, tableId, fields, values)
  )[tableIdValue];
}
