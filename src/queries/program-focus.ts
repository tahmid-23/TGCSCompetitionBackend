import { Connection } from 'mysql2/promise.js';
import { genericMultiQuery } from './utils/generic-queries.js';
import { createCommaSeparatedColumns } from './utils/query-utils.js';

const programCategoryFields = ['program_id', 'focus'];
const competitionCategoryColumns = createCommaSeparatedColumns(
  'program_focus',
  programCategoryFields
);

export async function queryAllProgramFocuses(
  connection: Connection
): Promise<Record<number, Record<string, object>[]>> {
  return genericMultiQuery(
    connection,
    `SELECT ${competitionCategoryColumns} FROM program_focus`,
    'program_id',
    programCategoryFields
  );
}
