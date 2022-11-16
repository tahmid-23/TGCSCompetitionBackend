import { Connection } from 'mysql2/promise';
import { genericMultiQuery } from './utils/generic-queries.js';
import { createCommaSeparatedColumns } from './utils/query-utils.js';

const experienceCategoryFields = ['experience_id', 'category'];
const experienceCategoryColumns = createCommaSeparatedColumns(
  'experience_category',
  experienceCategoryFields
);

export async function queryAllExperienceCategories(
  connection: Connection
): Promise<Record<number, Record<string, object>[]>> {
  return genericMultiQuery(
    connection,
    `SELECT ${experienceCategoryColumns} FROM experience_category`,
    'experience_id',
    experienceCategoryFields
  );
}
