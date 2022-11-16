import { Connection } from 'mysql2/promise';
import { genericMultiQuery } from './utils/generic-queries.js';
import { createCommaSeparatedColumns } from './utils/query-utils.js';

const awardFields = ['competition_id', 'type', 'description'];
const awardColumns = createCommaSeparatedColumns('award', awardFields);

export async function queryAllAwards(
  connection: Connection
): Promise<Record<number, Record<string, object>[]>> {
  return genericMultiQuery(
    connection,
    `SELECT ${awardColumns} FROM award`,
    'competition_id',
    awardFields
  );
}
