import { Connection } from 'mysql2/promise';

function createInsertColumns(columns: string[]): string {
  let columnsString = '';

  for (let i = 0; i < columns.length - 1; ++i) {
    columnsString += `\`${columns[i]}\`, `;
  }
  if (columns.length) {
    columnsString += `\`${columns[columns.length - 1]}\``;
  }

  return columnsString;
}

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

function createEqualsSeparatedUpdateColumns(columns: string[]): string {
  let columnString = '';

  for (let i = 0; i < columns.length - 1; ++i) {
    columnString += `\`${columns[i]}\` = ?, `;
  }
  if (columns.length) {
    columnString += `\`${columns[columns.length - 1]}\` = ?`;
  }

  return columnString;
}

export function insert(
  connection: Connection,
  tableName: string,
  data: Record<string, object>
) {
  const dataValues = Object.values(data);

  connection.query(
    `INSERT INTO \`${tableName}\` (${createInsertColumns(
      Object.keys(data)
    )}) VALUES(${createCommaSeparatedQuestionMarks(dataValues.length)})`,
    [...dataValues]
  );
}

export function update(
  connection: Connection,
  tableName: string,
  tableId: string,
  rowId: number,
  data: Record<string, object>
) {
  connection.query(
    `UPDATE \`${tableName}\`` +
      `SET ${createEqualsSeparatedUpdateColumns(Object.keys(data))}` +
      `WHERE \`${tableId}\` = ?`,
    [...Object.values(data), rowId]
  );
}

export function remove(
  connection: Connection,
  tableName: string,
  tableId: string,
  rowId: number
) {
  connection.query(`DELETE FROM \`${tableName}\` WHERE \`${tableId}\` = ?`, [
    rowId
  ]);
}
