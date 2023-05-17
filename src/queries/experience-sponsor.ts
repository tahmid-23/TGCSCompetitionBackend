import { Connection } from 'mysql2/promise.js';
import { genericMultiQuery } from './utils/generic-queries.js';
import { createCommaSeparatedColumns } from './utils/query-utils.js';

const experienceSponsorFields = ['experience_id', 'sponsor_id'];
const experienceCategoryColumns = createCommaSeparatedColumns(
  'experience_sponsor',
  experienceSponsorFields
);

export async function queryAllExperienceSponsors(
  connection: Connection
): Promise<Record<number, Record<string, object>[]>> {
  return genericMultiQuery(
    connection,
    `SELECT ${experienceCategoryColumns} FROM experience_sponsor`,
    'experience_id',
    experienceSponsorFields
  );
}
