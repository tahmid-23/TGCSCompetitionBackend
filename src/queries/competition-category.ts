import { Connection } from 'mysql2/promise';
import { genericMultiQuery } from './utils/generic-query.js';
import { createCommaSeparatedColumns } from './utils/query-utils.js';

const competitionCategoryFields = ['category'];
const competitionCategoryColumns = createCommaSeparatedColumns(
  'competition_category',
  'competition_id',
  competitionCategoryFields
);

export async function queryAllCompetitionCategories(
  connection: Connection
): Promise<Record<number, Record<string, object>[]>> {
  return genericMultiQuery(
    connection,
    `SELECT ${competitionCategoryColumns} FROM competition_category`,
    'competition_id',
    competitionCategoryFields
  );
}
