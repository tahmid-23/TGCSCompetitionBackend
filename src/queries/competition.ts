import { Connection } from 'mysql2/promise';
import { queryAllCompetitionCategories } from './competition-category.js';
import { genericQuery } from './utils/generic-query.js';
import { createCommaSeparatedColumns } from './utils/query-utils.js';

const competitionFields = ['judges_description', 'judging_criteria'];
const competitionColumnNames = createCommaSeparatedColumns(
  'competition',
  'competition_id',
  competitionFields
);

export async function queryAllCompetitions(
  connection: Connection
): Promise<Record<number, Record<string, object>>> {
  const competitionsPromise = genericQuery(
    connection,
    `SELECT ${competitionColumnNames} FROM competition`,
    'competition_id',
    competitionFields
  );
  const competitionCategoriesPromise =
    queryAllCompetitionCategories(connection);

  const [competitions, competitionCategories] = await Promise.all([
    competitionsPromise,
    competitionCategoriesPromise
  ]);

  for (const competitionId in competitions) {
    const queryCategories = competitionCategories[competitionId];
    if (queryCategories) {
      competitions[competitionId]['categories'] = [...queryCategories];
    } else {
      competitions[competitionId]['categories'] = [];
    }
  }

  return competitions;
}
