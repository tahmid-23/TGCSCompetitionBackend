import { Connection, RowDataPacket } from 'mysql2/promise.js';
import {
  genericMultiQuery,
  genericMultiQuerySingle,
  genericQuery
} from './utils/generic-queries.js';
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

export async function queryGrade(
  connection: Connection,
  experienceId: number
): Promise<Record<string, object>[]> {
  return await genericMultiQuerySingle(
    connection,
    `SELECT ${gradeColumns} FROM experience_grade WHERE experience_id = ?`,
    'experience_id',
    experienceId,
    gradeFields,
    [experienceId]
  );
}
