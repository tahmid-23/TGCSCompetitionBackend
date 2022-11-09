import { Connection } from 'mysql2/promise';
import { queryAllProgramCategories } from './program-category.js';
import { genericQuery } from './utils/generic-query.js';
import { createCommaSeparatedColumns } from './utils/query-utils.js';

const programFields = ['type', 'monthly_fee', 'time_commitment'];
const programColumnNames = createCommaSeparatedColumns(
  'program',
  'program_id',
  programFields
);

export async function queryAllPrograms(
  connection: Connection
): Promise<Record<number, Record<string, object>>> {
  const programsPromise = genericQuery(
    connection,
    `SELECT ${programColumnNames} FROM program`,
    'program_id',
    programFields
  );
  const programCategoriesPromise = queryAllProgramCategories(connection);

  const [programs, programCategories] = await Promise.all([
    programsPromise,
    programCategoriesPromise
  ]);

  for (const programId in programs) {
    const queryPrograms = programCategories[programId];
    if (queryPrograms) {
      programs[programId]['categories'] = [...queryPrograms];
    } else {
      programs[programId]['categories'] = [];
    }
  }

  return programs;
}
