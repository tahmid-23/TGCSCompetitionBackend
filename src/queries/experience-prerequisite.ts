import { Connection } from 'mysql2/promise';
import { genericMultiQuery } from './utils/generic-queries.js';
import { createCommaSeparatedColumns } from './utils/query-utils.js';

const experiencePrerequisiteFields = [
  'experience_id',
  'prerequisite_experience_id'
];
const experiencePrerequisiteColumns = createCommaSeparatedColumns(
  'experience_prerequisite',
  experiencePrerequisiteFields
);

export async function queryAllExperiencePrerequisites(
  connection: Connection
): Promise<Record<number, Record<string, object>[]>> {
  return genericMultiQuery(
    connection,
    `SELECT ${experiencePrerequisiteColumns} FROM experience_prerequisite`,
    'experience_id',
    experiencePrerequisiteFields
  );
}
