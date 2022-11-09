function tableColumnName(table: string, column: string): string {
  return `${table}.${column}`;
}

export function createCommaSeparatedColumns(
  tableName: string,
  tableId: string,
  columns: string[]
): string {
  let columnString = tableColumnName(tableName, tableId);
  if (columns.length) {
    columnString += ', ';
  }

  for (let i = 0; i < columns.length - 1; ++i) {
    columnString += tableColumnName(tableName, `${columns[i]}, `);
  }
  if (columns.length) {
    columnString += tableColumnName(
      tableName,
      `${columns[columns.length - 1]}`
    );
  }

  return columnString;
}
