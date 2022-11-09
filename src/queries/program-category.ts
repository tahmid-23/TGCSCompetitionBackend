import { Connection } from 'mysql2/promise';
import { genericMultiQuery } from './utils/generic-query.js';
import { createCommaSeparatedColumns } from './utils/query-utils.js';

const programCategoryFields = ['category'];
const competitionCategoryColumns = createCommaSeparatedColumns(
  'program_category',
  'program_id',
  programCategoryFields
);

export async function queryAllProgramCategories(
  connection: Connection
): Promise<Record<number, Record<string, object>[]>> {
  return genericMultiQuery(
    connection,
    `SELECT ${competitionCategoryColumns} FROM program_category`,
    'program_id',
    programCategoryFields
  );
}
