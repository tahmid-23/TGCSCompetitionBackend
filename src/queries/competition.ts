import { Connection } from 'mysql2/promise';
import { queryAllAwards } from './award.js';
import { genericQuery } from './utils/generic-queries.js';
import { createCommaSeparatedColumns } from './utils/query-utils.js';

const competitionFields = [
  'competition_id',
  'judges_description',
  'judging_criteria'
];
const competitionColumnNames = createCommaSeparatedColumns(
  'competition',
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
  const awardsPromise = queryAllAwards(connection);

  const [competitions, awards] = await Promise.all([
    competitionsPromise,
    awardsPromise
  ]);

  for (const competitionId in competitions) {
    const queryAwards = awards[competitionId];
    if (queryAwards) {
      competitions[competitionId]['awards'] = queryAwards;
    } else {
      competitions[competitionId]['awards'] = [];
    }
  }

  return competitions;
}
