import { Connection } from 'mysql2/promise';
import { genericMultiQuery } from './utils/generic-queries.js';
import { createCommaSeparatedColumns } from './utils/query-utils.js';

const gradeFields = ['experience_id', 'grade'];
const gradeColumns = createCommaSeparatedColumns(
  'experience_grade',
  gradeFields
);

export async function queryAllGrades(
  connection: Connection
): Promise<Record<number, Record<string, object>[]>> {
  return genericMultiQuery(
    connection,
    `SELECT ${gradeColumns} FROM experience_grade`,
    'experience_id',
    gradeFields
  );
}
