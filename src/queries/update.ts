import { Connection, ResultSetHeader } from 'mysql2/promise.js';

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

const tableNameToId: Record<string, string> = {
  award: 'competition_id',
  competition: 'competition_id',
  experience: 'experience_id',
  experience_category: 'experience_id',
  experience_grade: 'experience_id',
  experience_prerequisite: 'experience_id',
  experience_sponsor: 'experience_id',
  feedback: 'feedback',
  important_date: 'experience_id',
  program: 'program_id',
  program_focus: 'program_id',
  sponsor: 'sponsor_id'
};

export async function insert(
  connection: Connection,
  tableName: string,
  data: Record<string, object>
): Promise<number> {
  const tableId = tableNameToId[tableName];
  if (!tableId) {
    throw new Error(`Unknown table name ${tableName}`);
  }

  const dataValues = Object.values(data);

  const [result] = await connection.query<ResultSetHeader>(
    `INSERT INTO \`${tableName}\` (${createInsertColumns(
      Object.keys(data)
    )}) VALUES(${createCommaSeparatedQuestionMarks(dataValues.length)})`,
    [...dataValues]
  );

  return result.insertId;
}

export async function update(
  connection: Connection,
  tableName: string,
  rowId: number,
  data: Record<string, object>
) {
  const tableId = tableNameToId[tableName];
  if (!tableId) {
    throw new Error(`Unknown table name ${tableName}`);
  }

  await connection.query(
    `UPDATE \`${tableName}\`` +
      `SET ${createEqualsSeparatedUpdateColumns(Object.keys(data))}` +
      `WHERE \`${tableId}\` = ?`,
    [...Object.values(data), rowId]
  );
}

export async function remove(
  connection: Connection,
  tableName: string,
  rowName: string,
  rowId: number
) {
  await connection.query(
    `DELETE FROM \`${tableName}\` WHERE \`${rowName}\` = ?`,
    [rowId]
  );
}

export async function addScraper(
  connection: Connection,
  experienceId: number,
  root: string | undefined,
  path: number[]
) {
  const [result] = await connection.query<ResultSetHeader>(
    `INSERT INTO \`scraper\` (\`experience_id\`, \`root\`) VALUES (?, ?)`,
    [experienceId, root]
  );

  const insertId = result.insertId;
  for (let i = 0; i < path.length; ++i) {
    await connection.query(
      `INSERT INTO \`scraper_path\` (\`scraper_id\`, \`order\`, \`value\`) VALUES (?, ?, ?)`,
      [insertId, i, path[i]]
    );
  }
}
