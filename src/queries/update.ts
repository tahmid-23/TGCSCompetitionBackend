import { Connection } from 'mysql2/promise';
import { createCommaSeparatedColumns } from './utils/query-utils';

function createCommaSeparatedQuestionMarks(count: number): string {
  let result = '';

  for (let i = 0; i < count - 1; ++i) {
    result += '?, ';
  }

  if (count) {
    result += '?';
  }

  return result;
}

export function insert(
  connection: Connection,
  tableName: string,
  data: Record<string, object>
) {
  const dataValues = Object.entries(data);

  connection.query(
    `INSERT INTO ${tableName} (${createCommaSeparatedColumns(
      tableName,
      Object.keys(data)
    )}) VALUES(${createCommaSeparatedQuestionMarks(dataValues.length)})`,
    dataValues
  );
}
