import { Connection } from 'mysql2/promise.js';
import { genericMultiQuery } from './utils/generic-queries.js';
import { createCommaSeparatedColumns } from './utils/query-utils.js';

const importantDateFields = ['experience_id', 'description'];
const importantDateColumns = createCommaSeparatedColumns(
  'important_date',
  importantDateFields
);

export async function queryAllImportantDates(
  connection: Connection
): Promise<Record<number, Record<string, object>[]>> {
  return genericMultiQuery(
    connection,
    `SELECT ${importantDateColumns} FROM important_date`,
    'experience_id',
    importantDateFields
  );
}
