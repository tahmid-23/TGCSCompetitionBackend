import { Connection } from 'mysql2/promise';
import { queryAllProgramFocuses } from './program-focus.js';
import { genericQuery } from './utils/generic-queries.js';
import { createCommaSeparatedColumns } from './utils/query-utils.js';

const programFields = [
  'program_id',
  'program_type',
  'monthly_fee',
  'time_commitment',
];
const programColumnNames = createCommaSeparatedColumns(
  'program',
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
  const programFocusesPromise = queryAllProgramFocuses(connection);

  const [programs, programFocuses] = await Promise.all([
    programsPromise,
    programFocusesPromise
  ]);

  for (const programId in programs) {
    const queryFocuses = programFocuses[programId];
    if (queryFocuses) {
      programs[programId]['program_focuses'] = queryFocuses;
    } else {
      programs[programId]['program_focuses'] = [];
    }
  }

  return programs;
}
